var express = require('express');
var router = express.Router();
var securityHelper = require('../helpers/security-helper.js');
var dbHelper = require('../helpers/database-helper.js');
var errorHelper = require('../helpers/error-helper.js');
var utilityHelper = require('../helpers/utility-helper.js');
var config = require('../config.js');

router.get('/posts', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.findPosts().then(function (posts) {
        res.renderHybrid('management/posts', {posts: posts, roles: config.roles});
    }).catch(function (err) {
        next(err);
    });
});

router.get('/users', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.findUsers().then(function (users) {
        res.renderHybrid('management/users', {users: users, roles: config.roles});
    }).catch(function (err) {
        next(err);
    });
});

router.get('/editpost', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.findPost({_id: req.query.id}).then(function (post) {
        res.renderHybrid('management/post', {post: post});
    }).catch(function (err) {
        next(err);
    });
});

router.get('/edituser', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.findUser({_id: req.query.id}).then(function (user) {
        res.renderHybrid('management/user', {user: user, roles: config.roles});
    }).catch(function (err) {
        next(err);
    });
});

router.post('/edituser', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    var data = {username: req.body.username, email: req.body.email, role: parseInt(req.body.role), updateDate: Date.now(), validation: {validated: req.body.validated === 'on'}};
    if(req.body.hasOwnProperty('password') && !utilityHelper.isEmpty(req.body.password)){
        data.password = req.body.password;
        data.confirmPassword = req.body.confirmPassword;
    }
    dbHelper.updateUser({_id:req.query.id}, data, req.user).then(function (id) {
        res.redirect('/management/users');
    }).catch(function (err) {
        next(err);
    });
});

router.post('/deletepost', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.deletePost({_id: req.query.id}, req.user).then(function () {
        return dbHelper.findPosts();
    }).then(function (posts) {
        res.renderHybrid('management/posts', {posts: posts});
    }).catch(function (err) {
        next(err);
    });
});

router.post('/editpost', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    var post = {title: req.body.title, subtitle: req.body.subtitle, content: req.body.content, validation: {validated: req.body.validate === 'on'}};
    dbHelper.updatePost({_id: req.body._id}, post).then(function (id) {
        delete req.session.post;
        return dbHelper.findPost({_id:id});
    }).then(function (post) {
        res.renderHybrid('blog/post', {post: post});
    }).catch(function (err) {
        req.session.post = req.body;
        next(err);
    });
});

router.post('/banuser', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.updateUser({_id:req.query.id}, {role: -1}, req.user).then(function (id) {
        res.redirect('/management/users');
    }).catch(function (err) {
        next(err);
    });
});

router.post('/unbanuser', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.updateUser({_id:req.query.id}, {role: 1}, req.user).then(function (id) {
        res.redirect('/management/users');
    }).catch(function (err) {
        next(err);
    });
});

router.post('/deleteuser', securityHelper.isLogged, securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.deleteUser({_id: req.query.id}, req.user).then(function (cmdResult) {
        if(cmdResult.result.ok === 1)
            res.redirect('/management/users');
        else
            throw errorHelper.serverError('Errore nella rimozione dell\'utente', 500);
    }).catch(function (err) {
        next(err);
    });
});

router.get('/validate', securityHelper.isLogged,securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.updatePost({_id: req.query.id}, {'validation.validated': true, 'validation.validationDate': Date.now()}).then(function (id) {
        res.redirect('/management/posts');
    }).catch(function (err) {
        next(err);
    });
});

router.get('/disable', securityHelper.isLogged,securityHelper.setAdmin, securityHelper.isInRole, function (req, res, next) {
    dbHelper.updatePost({_id: req.query.id}, {'validation.validated': false, $unset: {'validation.validationDate': 1 }}).then(function (id) {
        res.redirect('/management/posts');
    }).catch(function (err) {
        next(err);
    });
});

module.exports = router;