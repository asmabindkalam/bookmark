const express = require('express');
const Bookmark = require('../models/bookmark');
const User = require('../models/user');
const router = express.Router();

// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
    next();
};

// Display all bookmarks (with pagination)
router.get('/bookmarks', isLoggedIn, async (req, res) => {
    const perPage = 3; // Number of bookmarks per page
    const page = parseInt(req.query.page) || 1; // Default to page 1

    try {
        // Get the total count of bookmarks for the logged-in user
        const totalBookmarks = await Bookmark.countDocuments({ user: req.session.userId });

        // Get the bookmarks for the current page
        const bookmarks = await Bookmark.find({ user: req.session.userId })
            .sort({ createdAt: -1 }) // Sort by creation time (latest first)
            .skip((page - 1) * perPage) // Skip the appropriate records for pagination
            .limit(perPage); // Limit to the desired number per page

        // Calculate total pages
        const totalPages = Math.ceil(totalBookmarks / perPage);

        res.render('bookmarks', {
            bookmarks,
            totalPages,
            currentPage: page,
            perPage,
        });
    } catch (err) {
        console.error('Error fetching bookmarks:', err);
        res.status(500).render('error', { message: 'An error occurred while fetching bookmarks.' });
    }
});

// Add a new bookmark
router.post('/bookmarks', isLoggedIn, async (req, res) => {
    const { title, url } = req.body;

    try {
        // Find the user
        const user = await User.findById(req.session.userId);

        // Check if the user has reached the limit of bookmarks
        if (user.bookmarks.length >= 5) {
            return res.render('error', {
                message: 'You can only add up to 5 bookmarks.',
                backUrl: '/bookmarks',
            });
        }

        // Create and save a new bookmark
        const bookmark = new Bookmark({ title, url, user: user._id });
        await bookmark.save();

        // Add bookmark to the user's list
        user.bookmarks.push(bookmark._id);
        await user.save();

        res.redirect('/bookmarks');
    } catch (err) {
        console.error('Error adding a bookmark:', err);
        res.status(500).render('error', { message: 'An error occurred while adding a bookmark.' });
    }
});

// Edit a bookmark - GET route
router.get('/bookmarks/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        // Check if the bookmark belongs to the logged-in user
        if (!bookmark || bookmark.user.toString() !== req.session.userId) {
            return res.render('error', {
                message: 'You can only edit your own bookmarks.',
                backUrl: '/bookmarks',
            });
        }

        res.render('edit-bookmark', { bookmark });
    } catch (err) {
        console.error('Error fetching bookmark for editing:', err);
        res.status(500).render('error', { message: 'An error occurred while fetching the bookmark for editing.' });
    }
});

// Edit a bookmark - POST route
router.post('/bookmarks/edit/:id', isLoggedIn, async (req, res) => {
    const { title, url } = req.body;

    try {
        // Update the bookmark
        const bookmark = await Bookmark.findById(req.params.id);

        // Ensure the bookmark belongs to the logged-in user
        if (!bookmark || bookmark.user.toString() !== req.session.userId) {
            return res.render('error', {
                message: 'You can only edit your own bookmarks.',
                backUrl: '/bookmarks',
            });
        }

        await Bookmark.findByIdAndUpdate(req.params.id, { title, url });
        res.redirect('/bookmarks');
    } catch (err) {
        console.error('Error editing a bookmark:', err);
        res.status(500).render('error', { message: 'An error occurred while editing the bookmark.' });
    }
});

// DELETE route to remove a bookmark by its ID
router.delete('/bookmarks/delete/:id', isLoggedIn, async (req, res) => {
    try {
        const bookmarkId = req.params.id;
        const bookmark = await Bookmark.findById(bookmarkId);

        // Ensure the bookmark belongs to the logged-in user
        if (!bookmark || bookmark.user.toString() !== req.session.userId) {
            return res.render('error', {
                message: 'You can only delete your own bookmarks.',
                backUrl: '/bookmarks',
            });
        }

        // Remove bookmark from user's list and delete it
        const user = await User.findById(req.session.userId);
        user.bookmarks = user.bookmarks.filter(id => id.toString() !== bookmarkId);
        await user.save();

        await Bookmark.findByIdAndDelete(bookmarkId);

        res.redirect('/bookmarks');
    } catch (err) {
        console.error('Error deleting bookmark:', err);
        res.status(500).render('error', { message: 'An error occurred while deleting the bookmark.' });
    }
});

// AJAX-based search for bookmarks by title or URL
router.get('/bookmarks/search', isLoggedIn, async (req, res) => {
    const query = req.query.q || '';

    try {
        const bookmarks = await Bookmark.find({
            user: req.session.userId,
            $or: [
                { title: new RegExp(query, 'i') },
                { url: new RegExp(query, 'i') },
            ],
        }).sort({ createdAt: -1 });

        res.json({ bookmarks });
    } catch (err) {
        console.error('Error searching bookmarks:', err);
        res.status(500).json({ error: 'An error occurred while searching bookmarks.' });
    }
});

module.exports = router;
