const express = require('express')
const app = express()
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const errorHandler = require('./middleware/errorHandling')
const authRouter = require("./routes/auth")
const userRouter = require("./routes/user")
const contactRouter = require("./routes/contact")
const countyRouter = require("./routes/county")
const placeRouter = require("./routes/place")
const hotelRouter = require("./routes/hotel")
const eventRouter = require("./routes/event")
const eventCountyRouter = require("./routes/eventcounty")
const exhibitionCountyRouter = require("./routes/exhibitioncounty")
const searchRouter = require("./routes/search")

const port = 5003

dotenv.config();
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("database connected"))
.catch((err) => console.log(err))

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: "10mb", extended: true}));

app.use(errorHandler);
app.use('/api/', authRouter);
app.use('/api/users', userRouter);
app.use('/api/', contactRouter);
app.use('/api/counties', countyRouter);
app.use('/api/places', placeRouter);
app.use('/api/hotels', hotelRouter);
app.use('/api/events', eventRouter);
app.use('/api/eventCounty', eventCountyRouter);
app.use('/api/exhibitionCounty', exhibitionCountyRouter);
app.use('/api/search', searchRouter);

app.get('/', (req, res) => res.send('Hello World!'))
app.listen(process.env.PORT || port, () => console.log(`Example app listening on port ${process.env.PORT}!`))