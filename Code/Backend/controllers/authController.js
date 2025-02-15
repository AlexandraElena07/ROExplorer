const User = require("../models/User");
const Place = require("../models/Places");
const Hotel = require("../models/Hotel");

const CryptoJS = require('crypto-js');
const jwt = require("jsonwebtoken");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

module.exports = {
    createUser: async (req, res, next) => {
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: CryptoJS.AES.encrypt(req.body.password, process.env.SECRET).toString(),
        });
        try {
            const existingUser = await User.findOne({ username: req.body.username });
            if (existingUser) {
                return res.status(409).json({ status: false, message: "Username already exists" });
            }

            await newUser.save();

            res.status(201).json({ status: true, message: "User successfully created" })
        } catch (error) {
            return next(error)
        }
    },


    loginUser: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ status: false, message: "Email and password are required" });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ status: false, message: "User not found" });
            }

            const decryptedPassword = CryptoJS.AES.decrypt(user.password, process.env.SECRET);
            const decryptedString = decryptedPassword.toString(CryptoJS.enc.Utf8);

            if (decryptedString !== password) {
                return res.status(401).json({ status: false, message: "Wrong password" });
            }

            if (!user.role) {
                return res.status(403).json({ status: false, message: "User role not defined" });
            }

            const validRoles = ["user", "admin"];
            if (!validRoles.includes(user.role)) {
                return res.status(403).json({ status: false, message: "Invalid user role" });
            }

            const userToken = jwt.sign(
                {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }, process.env.JWT_SECRET, { expiresIn: "360d" }
            );

            const user_id = user._id;

            res.status(200).json({ status: true, id: user_id, token: userToken });
        } catch (error) {
            console.error("Error during login:", error);  // Adaugă un log pentru debug
            return res.status(500).json({ status: false, message: "Internal Server Error" });
        }
    },

    logoutUser: async (req, res, next) => {
        try {
            if (!req.headers.authorization) {
                return res.status(400).json({ status: false, message: "Authorization header missing" });
            }
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            res.status(200).json({ status: true, message: 'Logout successful' });
        } catch (error) {
            return next(error);
        }
    },

    updateUser: async (req, res, next) => {
        const { username: newUsername, email, profile } = req.body;
        try {
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            if (newUsername && newUsername !== existingUser.username) {
                const usernameExists = await User.findOne({ username: newUsername });
                if (usernameExists) {
                    return res.status(409).json({ status: false, message: "Username already exists" });
                }
            }

            let imageUrl = profile || existingUser.profile;
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                imageUrl = result.secure_url;
            }

            const oldUsername = existingUser.username;
            existingUser.username = newUsername || existingUser.username;
            existingUser.profile = imageUrl;

            await existingUser.save();

            await Place.updateMany(
                { "reviews.username": oldUsername },
                { $set: { "reviews.$[elem].profile": imageUrl, "reviews.$[elem].username": newUsername || oldUsername } },
                { arrayFilters: [{ "elem.username": oldUsername }] }
            );

            await Hotel.updateMany(
                { "reviews.username": oldUsername },
                { $set: { "reviews.$[elem].profile": imageUrl, "reviews.$[elem].username": newUsername || oldUsername } },
                { arrayFilters: [{ "elem.username": oldUsername }] }
            );

            res.status(200).json({ status: true, message: "Updated successfully", user: existingUser });
        } catch (error) {
            console.error("Error updating user:", error);
            return next(error);
        }
    },

    saveTheme: async (req, res, next) => {
        const { username, theme } = req.body;

        try {
            const existingUser = await User.findOne({ username: req.body.username });
            if (!existingUser) {
                return res.status(409).json({ status: false, message: "Username doesn't exists" });
            }

            await User.updateOne({ username: username }, {
                $set: {
                    theme
                },
            });

            res.status(200).json({ status: true, message: "Theme successfully added" });
        } catch (error) {
            return next(error);
        }
    },

    checkAuth: (req, res) => {
        const token = req.headers.authorization.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user, profile) => {
            if (err) {
                return res.status(403).json({ isAuthenticated: false });
            }

            res.json({ isAuthenticated: true, username: user.username });
        });
    }
}