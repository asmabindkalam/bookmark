const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const router = express.Router();

// Signup route

router.get('/signup', (req, res) => {
    res.render('signup'); // Render the signup page
});

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Validation: Check username and password length
    if (username.length < 6 || password.length < 10) {
        return res.render('error', { 
            message: 'Username must be at least 6 characters and password must be at least 10 characters!', 
            backUrl: '/signup' // Redirect to the signup page
        
        });
    }

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('error', {
                
                message: 'User already exists!',
                backUrl: '/login'
            });
        }

        // Save the new user
        const user = new User({ username, password });
        await user.save();

        // Store user ID in the session and redirect
        req.session.userId = user._id;
        res.redirect('/bookmarks');
    } catch (err) {
        console.error('Error during signup:', err);
        res.render('error', { message: 'An error occurred. Please try again.' });
    }
});





// Login route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render('error', { message: 'Invalid credentials!' });
    }
    req.session.userId = user._id;
    res.redirect('/bookmarks/bookmarks');
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;