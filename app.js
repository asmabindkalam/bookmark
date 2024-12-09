const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override'); // Import method-override
const authRoutes = require('./routes/auth'); // Ensure this is a valid router export
const bookmarkRoutes = require('./routes/bookmarks'); // Ensure this is a valid router export

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bookmark-site', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Set up view engine (EJS)
app.set('view engine', 'ejs');

// Middleware for body parsing (to handle form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images)
app.use(express.static('public'));

// Enable DELETE and PUT methods in forms
app.use(methodOverride('_method')); // Method-override must be above route definitions

// Session middleware for user authentication
app.use(session({
    secret: 'bookmark-secret',
    resave: false,
    saveUninitialized: false
}));

// Route for the homepage ("/")
app.get('/', (req, res) => {
    res.render('index'); // Renders the "index.ejs" file
});

// Use authentication and bookmark routes
app.use('/', authRoutes); // Prefix auth routes with "/auth"
app.use('/bookmarks', bookmarkRoutes); // Prefix bookmark routes with "/bookmarks"

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
