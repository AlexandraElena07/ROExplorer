const User = require('../models/User');
const Place = require('../models/Places');
const County = require('../models/County');
const Hotel = require('../models/Hotel');

module.exports = {
    deleteUser: async (req, res, next) => {
        try {
            await User.findByIdAndDelete(req.user.id);

            res.status(200).json({ status: true, message: "User successfully deleted" });
        } catch (error) {
            return next(error);
        }
    },

    getUser: async (req, res, next) => {
        const user_id = req.user.id;

        try {
            const user = await User.findById({ _id: user_id }, { password: 0, __v: 0, createdAt: 0, updatedAt: 0 });

            if (!user) {
                return res.status(401).json({ status: false, message: "User does not exist" });
            }

            res.status(200).json(user);
        } catch (error) {
            return next(error);
        }
    },

    addToFavorites: async (req, res, next) => {
        const { itemId, itemType } = req.body;
        const user_id = req.user.id;

        try {
            const user = await User.findById(user_id);

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            let item;
            let countyId;

            if (itemType === 'Place') {
                item = await Place.findById(itemId);
                countyId = item.county_id;
            } else if (itemType === 'County') {
                item = await County.findById(itemId);
                countyId = item._id;
            } else {
                item = await Hotel.findById(itemId);
                countyId = item.county_id;
            }

            if (!item) {
                return res.status(401).json({ message: `${itemType} not found` });
            }

            user.favorites.push({ _id: itemId, type: itemType, countyId });
            await user.save();

            res.status(200).json({ message: `${itemType} added to favorites` });
        } catch (error) {
            return next(error);
        }
    },

    getFavorites: async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const favoritesDetailed = await Promise.all(user.favorites.map(async (fav) => {
                let itemDetails;

                if (fav.type === 'Place') {
                    itemDetails = await Place.findById(fav._id);
                } else if (fav.type === 'County') {
                    itemDetails = await County.findById(fav._id);
                } else {
                    itemDetails = await Hotel.findById(fav._id);
                }

                return {
                    _id: fav._id,
                    type: fav.type,
                    countyId: fav.countyId,
                    details: itemDetails
                };
            }));

            res.status(200).json({ favorites: favoritesDetailed });
        } catch (error) {
            next(error);
        }
    },

    removeFromFavorites: async (req, res, next) => {
        const { itemId, itemType } = req.body;
        const user_id = req.user.id;

        try {
            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.favorites = user.favorites.filter(fav => fav._id.toString() !== itemId || fav.type !== itemType);

            await user.save();

            res.status(200).json({ message: `${itemType} removed from favorites` });
        } catch (error) {
            next(error);
        }
    }
}
