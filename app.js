console.log('Smile, if you ohk')
const express = require('express');
const app = express();
const path = require('path');
const route = require('./routes/route');
const adminRoute = require('./routes/admin');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const upload = require('express-fileupload');
const dotenv = require('dotenv');
dotenv.config({ path: "./config.env" });

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(upload());

app.use(express.json());
app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
app.use(cookieParser());

app.set('layout', 'partials/landing');
app.use(expressLayouts);

app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({ extended: true }));

// Middleware to provide gallery data to all routes
app.use((req, res, next) => {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, 'data');
    
    const readJSON = (filename) => {
        const filePath = path.join(dataPath, filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return [];
    };
    
    // Get last 6 gallery images for footer
    res.locals.gallery = readJSON('gallery.json').slice(-6);
    next();
});

app.use('/', route);
app.use('/admin', adminRoute);

const http = require("http").createServer(app);

const port = process.env.PORT || 4000

http.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`http://localhost:${port}`)
});