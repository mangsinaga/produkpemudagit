const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data');

// Helper function for file upload
const handleImageUpload = (file, uploadDir, prefix) => {
    if (!file) return null;
    
    const uploadPath = path.join(__dirname, '../public', uploadDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${prefix}-${Date.now()}${ext}`;
    const filePath = path.join(uploadPath, filename);
    
    // Move file
    file.mv(filePath, (err) => {
        if (err) console.error('Upload error:', err);
    });
    
    return `${uploadDir}/${filename}`;
};

// Helper functions
const readJSON = (filename) => {
    const filePath = path.join(dataPath, filename);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
};

const writeJSON = (filename, data) => {
    const filePath = path.join(dataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Auth Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    res.redirect('/admin/login');
};

// Root redirect
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Login Page
router.get('/login', (req, res) => {
    res.render('admin/login', { layout: false, error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON('users.json');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        req.session.admin = user;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { layout: false, error: 'Username atau password salah!' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    const articles = readJSON('articles.json');
    const testimonials = readJSON('testimonials.json');
    const cards = readJSON('cards.json');
    const services = readJSON('services.json');
    const projects = readJSON('projects.json');
    
    res.render('admin/dashboard', {
        layout: 'admin/layout',
        admin: req.session.admin,
        stats: {
            articles: articles.length,
            testimonials: testimonials.length,
            cards: cards.length,
            services: services.length,
            projects: projects.length
        }
    });
});

// Articles CRUD
router.get('/articles', isAuthenticated, (req, res) => {
    const articles = readJSON('articles.json');
    res.render('admin/articles/index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        articles
    });
});

router.get('/articles/create', isAuthenticated, (req, res) => {
    res.render('admin/articles/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        article: null,
        action: 'create'
    });
});

router.post('/articles/create', isAuthenticated, (req, res) => {
    const articles = readJSON('articles.json');
    const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
    
    const newArticle = {
        id: newId,
        title: req.body.title,
        slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        excerpt: req.body.excerpt,
        content: req.body.content,
        image: req.body.image || '/img/blog/blog-1.jpg',
        category: req.body.category,
        author: req.session.admin.name,
        date: new Date().toISOString().split('T')[0],
        published: req.body.published === 'on'
    };
    
    articles.push(newArticle);
    writeJSON('articles.json', articles);
    res.redirect('/admin/articles');
});

router.get('/articles/edit/:id', isAuthenticated, (req, res) => {
    const articles = readJSON('articles.json');
    const article = articles.find(a => a.id === parseInt(req.params.id));
    
    if (!article) {
        return res.redirect('/admin/articles');
    }
    
    res.render('admin/articles/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        article,
        action: 'edit'
    });
});

router.post('/articles/edit/:id', isAuthenticated, (req, res) => {
    const articles = readJSON('articles.json');
    const index = articles.findIndex(a => a.id === parseInt(req.params.id));
    
    if (index !== -1) {
        articles[index] = {
            ...articles[index],
            title: req.body.title,
            slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            excerpt: req.body.excerpt,
            content: req.body.content,
            image: req.body.image || articles[index].image,
            category: req.body.category,
            published: req.body.published === 'on'
        };
        writeJSON('articles.json', articles);
    }
    
    res.redirect('/admin/articles');
});

router.get('/articles/delete/:id', isAuthenticated, (req, res) => {
    let articles = readJSON('articles.json');
    articles = articles.filter(a => a.id !== parseInt(req.params.id));
    writeJSON('articles.json', articles);
    res.redirect('/admin/articles');
});

// Portfolio CRUD
router.get('/portfolio', isAuthenticated, (req, res) => {
    const portfolio = readJSON('portfolio.json');
    res.render('admin/portfolio/index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        portfolio
    });
});

router.get('/portfolio/create', isAuthenticated, (req, res) => {
    res.render('admin/portfolio/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        item: null,
        action: 'create'
    });
});

router.post('/portfolio/create', isAuthenticated, (req, res) => {
    const portfolio = readJSON('portfolio.json');
    const newId = portfolio.length > 0 ? Math.max(...portfolio.map(p => p.id)) + 1 : 1;
    
    const newItem = {
        id: newId,
        title: req.body.title,
        slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: req.body.description,
        image: req.body.image || '/img/project/project-1.jpg',
        category: req.body.category,
        client: req.body.client,
        date: new Date().toISOString().split('T')[0],
        published: req.body.published === 'on'
    };
    
    portfolio.push(newItem);
    writeJSON('portfolio.json', portfolio);
    res.redirect('/admin/portfolio');
});

router.get('/portfolio/edit/:id', isAuthenticated, (req, res) => {
    const portfolio = readJSON('portfolio.json');
    const item = portfolio.find(p => p.id === parseInt(req.params.id));
    
    if (!item) {
        return res.redirect('/admin/portfolio');
    }
    
    res.render('admin/portfolio/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        item,
        action: 'edit'
    });
});

router.post('/portfolio/edit/:id', isAuthenticated, (req, res) => {
    const portfolio = readJSON('portfolio.json');
    const index = portfolio.findIndex(p => p.id === parseInt(req.params.id));
    
    if (index !== -1) {
        portfolio[index] = {
            ...portfolio[index],
            title: req.body.title,
            slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            description: req.body.description,
            image: req.body.image || portfolio[index].image,
            category: req.body.category,
            client: req.body.client,
            published: req.body.published === 'on'
        };
        writeJSON('portfolio.json', portfolio);
    }
    
    res.redirect('/admin/portfolio');
});

router.get('/portfolio/delete/:id', isAuthenticated, (req, res) => {
    let portfolio = readJSON('portfolio.json');
    portfolio = portfolio.filter(p => p.id !== parseInt(req.params.id));
    writeJSON('portfolio.json', portfolio);
    res.redirect('/admin/portfolio');
});

// Testimonials CRUD
router.get('/testimonials', isAuthenticated, (req, res) => {
    const testimonials = readJSON('testimonials.json');
    res.render('admin/testimonials/index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        testimonials
    });
});

router.get('/testimonials/create', isAuthenticated, (req, res) => {
    res.render('admin/testimonials/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        testimonial: null,
        action: 'create'
    });
});

router.post('/testimonials/create', isAuthenticated, (req, res) => {
    const testimonials = readJSON('testimonials.json');
    const newId = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.id)) + 1 : 1;
    
    const newTestimonial = {
        id: newId,
        name: req.body.name,
        position: req.body.position,
        content: req.body.content,
        image: req.body.image || '/img/testimonial/testimonial-1.jpg',
        rating: parseInt(req.body.rating) || 5,
        published: req.body.published === 'on'
    };
    
    testimonials.push(newTestimonial);
    writeJSON('testimonials.json', testimonials);
    res.redirect('/admin/testimonials');
});

router.get('/testimonials/edit/:id', isAuthenticated, (req, res) => {
    const testimonials = readJSON('testimonials.json');
    const testimonial = testimonials.find(t => t.id === parseInt(req.params.id));
    
    if (!testimonial) {
        return res.redirect('/admin/testimonials');
    }
    
    res.render('admin/testimonials/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        testimonial,
        action: 'edit'
    });
});

router.post('/testimonials/edit/:id', isAuthenticated, (req, res) => {
    const testimonials = readJSON('testimonials.json');
    const index = testimonials.findIndex(t => t.id === parseInt(req.params.id));
    
    if (index !== -1) {
        testimonials[index] = {
            ...testimonials[index],
            name: req.body.name,
            position: req.body.position,
            content: req.body.content,
            image: req.body.image || testimonials[index].image,
            rating: parseInt(req.body.rating) || 5,
            published: req.body.published === 'on'
        };
        writeJSON('testimonials.json', testimonials);
    }
    
    res.redirect('/admin/testimonials');
});

router.get('/testimonials/delete/:id', isAuthenticated, (req, res) => {
    let testimonials = readJSON('testimonials.json');
    testimonials = testimonials.filter(t => t.id !== parseInt(req.params.id));
    writeJSON('testimonials.json', testimonials);
    res.redirect('/admin/testimonials');
});

// Business Cards CRUD
router.get('/cards', isAuthenticated, (req, res) => {
    const cards = readJSON('cards.json');
    res.render('admin/cards/index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        cards
    });
});

router.get('/cards/create', isAuthenticated, (req, res) => {
    res.render('admin/cards/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        card: null,
        action: 'create'
    });
});

router.post('/cards/create', isAuthenticated, (req, res) => {
    const cards = readJSON('cards.json');
    const newId = cards.length > 0 ? Math.max(...cards.map(c => c.id)) + 1 : 1;
    
    const newCard = {
        id: newId,
        name: req.body.name,
        slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        position: req.body.position,
        email: req.body.email,
        phone: req.body.phone,
        summary: req.body.summary,
        photo: req.body.photo || '/img/team/team-1.jpg',
        social: {
            linkedin: req.body.social_linkedin || '',
            instagram: req.body.social_instagram || '',
            twitter: req.body.social_twitter || ''
        },
        published: req.body.published === 'on',
        created_at: new Date().toISOString().split('T')[0]
    };
    
    cards.push(newCard);
    writeJSON('cards.json', cards);
    res.redirect('/admin/cards');
});

router.get('/cards/edit/:id', isAuthenticated, (req, res) => {
    const cards = readJSON('cards.json');
    const card = cards.find(c => c.id === parseInt(req.params.id));
    
    if (!card) {
        return res.redirect('/admin/cards');
    }
    
    res.render('admin/cards/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        card,
        action: 'edit'
    });
});

router.post('/cards/edit/:id', isAuthenticated, (req, res) => {
    const cards = readJSON('cards.json');
    const index = cards.findIndex(c => c.id === parseInt(req.params.id));
    
    if (index !== -1) {
        cards[index] = {
            ...cards[index],
            name: req.body.name,
            slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            position: req.body.position,
            email: req.body.email,
            phone: req.body.phone,
            summary: req.body.summary,
            photo: req.body.photo || cards[index].photo,
            social: {
                linkedin: req.body.social_linkedin || '',
                instagram: req.body.social_instagram || '',
                twitter: req.body.social_twitter || ''
            },
            published: req.body.published === 'on'
        };
        writeJSON('cards.json', cards);
    }
    
    res.redirect('/admin/cards');
});

router.get('/cards/delete/:id', isAuthenticated, (req, res) => {
    let cards = readJSON('cards.json');
    cards = cards.filter(c => c.id !== parseInt(req.params.id));
    writeJSON('cards.json', cards);
    res.redirect('/admin/cards');
});

// Services CRUD
router.get('/services', isAuthenticated, (req, res) => {
    const services = readJSON('services.json');
    const categories = readJSON('service-categories.json');
    const tags = readJSON('service-tags.json');
    res.render('admin/services/index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        services: services.sort((a, b) => a.order - b.order),
        categories,
        tags
    });
});

router.get('/services/create', isAuthenticated, (req, res) => {
    const categories = readJSON('service-categories.json');
    const tags = readJSON('service-tags.json');
    res.render('admin/services/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        service: null,
        categories,
        tags,
        action: 'create'
    });
});

router.post('/services/create', isAuthenticated, (req, res) => {
    const services = readJSON('services.json');
    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    
    let tagsArray = [];
    if (req.body.tags) {
        tagsArray = Array.isArray(req.body.tags) ? req.body.tags.map(t => parseInt(t)) : [parseInt(req.body.tags)];
    }
    
    // Handle image upload for services
    let featuredImage = req.body.featuredImage || '/img/all-images/service/service-img1.png';
    if (req.files && req.files.featuredImageFile) {
        const uploadedPath = handleImageUpload(req.files.featuredImageFile, '/img/all-images/service', 'service');
        if (uploadedPath) featuredImage = uploadedPath;
    }
    
    // Handle specification image upload
    let specificationImage = req.body.specificationImage || '';
    if (req.files && req.files.specificationImageFile) {
        const uploadedPath = handleImageUpload(req.files.specificationImageFile, '/img/all-images/service/specs', 'spec');
        if (uploadedPath) specificationImage = uploadedPath;
    }
    
    const newService = {
        id: newId,
        title: req.body.title,
        slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        shortDescription: req.body.shortDescription,
        content: req.body.content || '',
        featuredImage: featuredImage,
        icon: req.body.icon || '/img/icons/service16.svg',
        categoryId: parseInt(req.body.categoryId),
        tags: tagsArray,
        specificationLabel: req.body.specificationLabel || 'Spesifikasi',
        specificationImage: specificationImage,
        seo: {
            metaTitle: req.body.seo_metaTitle || '',
            metaDescription: req.body.seo_metaDescription || '',
            metaKeywords: req.body.seo_metaKeywords || '',
            canonical: req.body.seo_canonical || '',
            ogImage: req.body.seo_ogImage || '',
            schema: req.body.seo_schema || ''
        },
        order: parseInt(req.body.order) || 1,
        published: req.body.published === 'on',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };
    
    services.push(newService);
    writeJSON('services.json', services);
    res.redirect('/admin/services');
});

router.get('/services/edit/:id', isAuthenticated, (req, res) => {
    const services = readJSON('services.json');
    const categories = readJSON('service-categories.json');
    const tags = readJSON('service-tags.json');
    const service = services.find(s => s.id === parseInt(req.params.id));
    
    if (!service) {
        return res.redirect('/admin/services');
    }
    
    res.render('admin/services/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        service,
        categories,
        tags,
        action: 'edit'
    });
});

router.post('/services/edit/:id', isAuthenticated, (req, res) => {
    const services = readJSON('services.json');
    const index = services.findIndex(s => s.id === parseInt(req.params.id));
    
    if (index !== -1) {
        let tagsArray = [];
        if (req.body.tags) {
            tagsArray = Array.isArray(req.body.tags) ? req.body.tags.map(t => parseInt(t)) : [parseInt(req.body.tags)];
        }
        
        // Handle image upload for services edit
        let featuredImage = req.body.featuredImage || services[index].featuredImage;
        if (req.files && req.files.featuredImageFile) {
            const uploadedPath = handleImageUpload(req.files.featuredImageFile, '/img/all-images/service', 'service');
            if (uploadedPath) featuredImage = uploadedPath;
        }
        
        // Handle specification image upload for edit
        let specificationImage = req.body.specificationImage || services[index].specificationImage || '';
        if (req.files && req.files.specificationImageFile) {
            const uploadedPath = handleImageUpload(req.files.specificationImageFile, '/img/all-images/service/specs', 'spec');
            if (uploadedPath) specificationImage = uploadedPath;
        }
        
        services[index] = {
            ...services[index],
            title: req.body.title,
            slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            shortDescription: req.body.shortDescription,
            content: req.body.content || '',
            featuredImage: featuredImage,
            icon: req.body.icon || services[index].icon,
            categoryId: parseInt(req.body.categoryId),
            tags: tagsArray,
            specificationLabel: req.body.specificationLabel || 'Spesifikasi',
            specificationImage: specificationImage,
            seo: {
                metaTitle: req.body.seo_metaTitle || '',
                metaDescription: req.body.seo_metaDescription || '',
                metaKeywords: req.body.seo_metaKeywords || '',
                canonical: req.body.seo_canonical || '',
                ogImage: req.body.seo_ogImage || '',
                schema: req.body.seo_schema || ''
            },
            order: parseInt(req.body.order) || 1,
            published: req.body.published === 'on',
            updatedAt: new Date().toISOString().split('T')[0]
        };
        writeJSON('services.json', services);
    }
    
    res.redirect('/admin/services');
});

router.get('/services/delete/:id', isAuthenticated, (req, res) => {
    let services = readJSON('services.json');
    services = services.filter(s => s.id !== parseInt(req.params.id));
    writeJSON('services.json', services);
    res.redirect('/admin/services');
});

// Service Categories CRUD
router.get('/service-categories', isAuthenticated, (req, res) => {
    const categories = readJSON('service-categories.json');
    res.render('admin/services/categories', {
        layout: 'admin/layout',
        admin: req.session.admin,
        categories,
        editCategory: null
    });
});

router.get('/service-categories/edit/:id', isAuthenticated, (req, res) => {
    const categories = readJSON('service-categories.json');
    const editCategory = categories.find(c => c.id === parseInt(req.params.id));
    res.render('admin/services/categories', {
        layout: 'admin/layout',
        admin: req.session.admin,
        categories,
        editCategory
    });
});

router.post('/service-categories/create', isAuthenticated, (req, res) => {
    const categories = readJSON('service-categories.json');
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    
    const newCategory = {
        id: newId,
        name: req.body.name,
        slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: req.body.description || '',
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    categories.push(newCategory);
    writeJSON('service-categories.json', categories);
    res.redirect('/admin/service-categories');
});

router.post('/service-categories/edit/:id', isAuthenticated, (req, res) => {
    const categories = readJSON('service-categories.json');
    const index = categories.findIndex(c => c.id === parseInt(req.params.id));
    
    if (index !== -1) {
        categories[index] = {
            ...categories[index],
            name: req.body.name,
            slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            description: req.body.description || ''
        };
        writeJSON('service-categories.json', categories);
    }
    
    res.redirect('/admin/service-categories');
});

router.get('/service-categories/delete/:id', isAuthenticated, (req, res) => {
    let categories = readJSON('service-categories.json');
    categories = categories.filter(c => c.id !== parseInt(req.params.id));
    writeJSON('service-categories.json', categories);
    res.redirect('/admin/service-categories');
});

// Service Tags CRUD
router.get('/service-tags', isAuthenticated, (req, res) => {
    const tags = readJSON('service-tags.json');
    res.render('admin/services/tags', {
        layout: 'admin/layout',
        admin: req.session.admin,
        tags,
        editTag: null
    });
});

router.get('/service-tags/edit/:id', isAuthenticated, (req, res) => {
    const tags = readJSON('service-tags.json');
    const editTag = tags.find(t => t.id === parseInt(req.params.id));
    res.render('admin/services/tags', {
        layout: 'admin/layout',
        admin: req.session.admin,
        tags,
        editTag
    });
});

router.post('/service-tags/create', isAuthenticated, (req, res) => {
    const tags = readJSON('service-tags.json');
    const newId = tags.length > 0 ? Math.max(...tags.map(t => t.id)) + 1 : 1;
    
    const newTag = {
        id: newId,
        name: req.body.name,
        slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    tags.push(newTag);
    writeJSON('service-tags.json', tags);
    res.redirect('/admin/service-tags');
});

router.post('/service-tags/edit/:id', isAuthenticated, (req, res) => {
    const tags = readJSON('service-tags.json');
    const index = tags.findIndex(t => t.id === parseInt(req.params.id));
    
    if (index !== -1) {
        tags[index] = {
            ...tags[index],
            name: req.body.name,
            slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        };
        writeJSON('service-tags.json', tags);
    }
    
    res.redirect('/admin/service-tags');
});

router.get('/service-tags/delete/:id', isAuthenticated, (req, res) => {
    let tags = readJSON('service-tags.json');
    tags = tags.filter(t => t.id !== parseInt(req.params.id));
    writeJSON('service-tags.json', tags);
    res.redirect('/admin/service-tags');
});

// Projects CRUD
router.get('/projects', isAuthenticated, (req, res) => {
    const projects = readJSON('projects.json');
    const categories = readJSON('project-categories.json');
    const tags = readJSON('project-tags.json');
    res.render('admin/projects/index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        projects: projects.sort((a, b) => a.order - b.order),
        categories,
        tags
    });
});

router.get('/projects/create', isAuthenticated, (req, res) => {
    const categories = readJSON('project-categories.json');
    const tags = readJSON('project-tags.json');
    res.render('admin/projects/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        project: null,
        categories,
        tags,
        action: 'create'
    });
});

router.post('/projects/create', isAuthenticated, (req, res) => {
    const projects = readJSON('projects.json');
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    
    let tagsArray = [];
    if (req.body.tags) {
        tagsArray = Array.isArray(req.body.tags) ? req.body.tags.map(t => parseInt(t)) : [parseInt(req.body.tags)];
    }
    
    // Handle image upload
    let featuredImage = req.body.featuredImage || '/img/all-images/project/project-img14.png';
    if (req.files && req.files.featuredImageFile) {
        const uploadedPath = handleImageUpload(req.files.featuredImageFile, '/img/all-images/project', 'project');
        if (uploadedPath) featuredImage = uploadedPath;
    }
    
    const newProject = {
        id: newId,
        title: req.body.title,
        slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        shortDescription: req.body.shortDescription,
        content: req.body.content || '',
        featuredImage: featuredImage,
        categoryId: parseInt(req.body.categoryId),
        tags: tagsArray,
        seo: {
            metaTitle: req.body.seo_metaTitle || '',
            metaDescription: req.body.seo_metaDescription || '',
            metaKeywords: req.body.seo_metaKeywords || '',
            canonical: req.body.seo_canonical || '',
            ogImage: req.body.seo_ogImage || '',
            schema: req.body.seo_schema || ''
        },
        order: parseInt(req.body.order) || 1,
        published: req.body.published === 'on',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };
    
    projects.push(newProject);
    writeJSON('projects.json', projects);
    res.redirect('/admin/projects');
});

router.get('/projects/edit/:id', isAuthenticated, (req, res) => {
    const projects = readJSON('projects.json');
    const categories = readJSON('project-categories.json');
    const tags = readJSON('project-tags.json');
    const project = projects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
        return res.redirect('/admin/projects');
    }
    
    res.render('admin/projects/form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        project,
        categories,
        tags,
        action: 'edit'
    });
});

router.post('/projects/edit/:id', isAuthenticated, (req, res) => {
    const projects = readJSON('projects.json');
    const index = projects.findIndex(p => p.id === parseInt(req.params.id));
    
    if (index !== -1) {
        let tagsArray = [];
        if (req.body.tags) {
            tagsArray = Array.isArray(req.body.tags) ? req.body.tags.map(t => parseInt(t)) : [parseInt(req.body.tags)];
        }
        
        // Handle image upload
        let featuredImage = req.body.featuredImage || projects[index].featuredImage;
        if (req.files && req.files.featuredImageFile) {
            const uploadedPath = handleImageUpload(req.files.featuredImageFile, '/img/all-images/project', 'project');
            if (uploadedPath) featuredImage = uploadedPath;
        }
        
        projects[index] = {
            ...projects[index],
            title: req.body.title,
            slug: req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            shortDescription: req.body.shortDescription,
            content: req.body.content || '',
            featuredImage: featuredImage,
            categoryId: parseInt(req.body.categoryId),
            tags: tagsArray,
            seo: {
                metaTitle: req.body.seo_metaTitle || '',
                metaDescription: req.body.seo_metaDescription || '',
                metaKeywords: req.body.seo_metaKeywords || '',
                canonical: req.body.seo_canonical || '',
                ogImage: req.body.seo_ogImage || '',
                schema: req.body.seo_schema || ''
            },
            order: parseInt(req.body.order) || 1,
            published: req.body.published === 'on',
            updatedAt: new Date().toISOString().split('T')[0]
        };
        writeJSON('projects.json', projects);
    }
    
    res.redirect('/admin/projects');
});

router.get('/projects/delete/:id', isAuthenticated, (req, res) => {
    let projects = readJSON('projects.json');
    projects = projects.filter(p => p.id !== parseInt(req.params.id));
    writeJSON('projects.json', projects);
    res.redirect('/admin/projects');
});

// Project Categories CRUD
router.get('/project-categories', isAuthenticated, (req, res) => {
    const categories = readJSON('project-categories.json');
    res.render('admin/projects/categories', {
        layout: 'admin/layout',
        admin: req.session.admin,
        categories,
        editCategory: null
    });
});

router.get('/project-categories/edit/:id', isAuthenticated, (req, res) => {
    const categories = readJSON('project-categories.json');
    const editCategory = categories.find(c => c.id === parseInt(req.params.id));
    res.render('admin/projects/categories', {
        layout: 'admin/layout',
        admin: req.session.admin,
        categories,
        editCategory
    });
});

router.post('/project-categories/create', isAuthenticated, (req, res) => {
    const categories = readJSON('project-categories.json');
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    
    const newCategory = {
        id: newId,
        name: req.body.name,
        slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: req.body.description || '',
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    categories.push(newCategory);
    writeJSON('project-categories.json', categories);
    res.redirect('/admin/project-categories');
});

router.post('/project-categories/edit/:id', isAuthenticated, (req, res) => {
    const categories = readJSON('project-categories.json');
    const index = categories.findIndex(c => c.id === parseInt(req.params.id));
    
    if (index !== -1) {
        categories[index] = {
            ...categories[index],
            name: req.body.name,
            slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            description: req.body.description || ''
        };
        writeJSON('project-categories.json', categories);
    }
    
    res.redirect('/admin/project-categories');
});

router.get('/project-categories/delete/:id', isAuthenticated, (req, res) => {
    let categories = readJSON('project-categories.json');
    categories = categories.filter(c => c.id !== parseInt(req.params.id));
    writeJSON('project-categories.json', categories);
    res.redirect('/admin/project-categories');
});

// Project Tags CRUD
router.get('/project-tags', isAuthenticated, (req, res) => {
    const tags = readJSON('project-tags.json');
    res.render('admin/projects/tags', {
        layout: 'admin/layout',
        admin: req.session.admin,
        tags,
        editTag: null
    });
});

router.get('/project-tags/edit/:id', isAuthenticated, (req, res) => {
    const tags = readJSON('project-tags.json');
    const editTag = tags.find(t => t.id === parseInt(req.params.id));
    res.render('admin/projects/tags', {
        layout: 'admin/layout',
        admin: req.session.admin,
        tags,
        editTag
    });
});

router.post('/project-tags/create', isAuthenticated, (req, res) => {
    const tags = readJSON('project-tags.json');
    const newId = tags.length > 0 ? Math.max(...tags.map(t => t.id)) + 1 : 1;
    
    const newTag = {
        id: newId,
        name: req.body.name,
        slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    tags.push(newTag);
    writeJSON('project-tags.json', tags);
    res.redirect('/admin/project-tags');
});

router.post('/project-tags/edit/:id', isAuthenticated, (req, res) => {
    const tags = readJSON('project-tags.json');
    const index = tags.findIndex(t => t.id === parseInt(req.params.id));
    
    if (index !== -1) {
        tags[index] = {
            ...tags[index],
            name: req.body.name,
            slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        };
        writeJSON('project-tags.json', tags);
    }
    
    res.redirect('/admin/project-tags');
});

router.get('/project-tags/delete/:id', isAuthenticated, (req, res) => {
    let tags = readJSON('project-tags.json');
    tags = tags.filter(t => t.id !== parseInt(req.params.id));
    writeJSON('project-tags.json', tags);
    res.redirect('/admin/project-tags');
});

// CSR Focus CRUD
router.get('/csr-focus', isAuthenticated, (req, res) => {
    const csrFocus = readJSON('csr-focus.json');
    res.render('admin/csr/focus-index', {
        layout: 'admin/layout',
        admin: req.session.admin,
        csrFocus: csrFocus.sort((a, b) => a.order - b.order),
        page: 'csr-focus'
    });
});

router.get('/csr-focus/create', isAuthenticated, (req, res) => {
    res.render('admin/csr/focus-form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        item: null,
        action: 'create',
        page: 'csr-focus'
    });
});

router.post('/csr-focus/create', isAuthenticated, (req, res) => {
    const csrFocus = readJSON('csr-focus.json');
    const newId = csrFocus.length > 0 ? Math.max(...csrFocus.map(c => c.id)) + 1 : 1;
    
    // Handle image upload
    let image = req.body.image || '/img/all-images/service/service-img5.png';
    if (req.files && req.files.imageFile) {
        const uploadedPath = handleImageUpload(req.files.imageFile, '/img/all-images/csr', 'csr-focus');
        if (uploadedPath) image = uploadedPath;
    }
    
    const newItem = {
        id: newId,
        title: req.body.title,
        description: req.body.description,
        image: image,
        order: parseInt(req.body.order) || 1,
        published: req.body.published === 'on',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };
    
    csrFocus.push(newItem);
    writeJSON('csr-focus.json', csrFocus);
    res.redirect('/admin/csr-focus');
});

router.get('/csr-focus/edit/:id', isAuthenticated, (req, res) => {
    const csrFocus = readJSON('csr-focus.json');
    const item = csrFocus.find(c => c.id === parseInt(req.params.id));
    
    if (!item) {
        return res.redirect('/admin/csr-focus');
    }
    
    res.render('admin/csr/focus-form', {
        layout: 'admin/layout',
        admin: req.session.admin,
        item,
        action: 'edit',
        page: 'csr-focus'
    });
});

router.post('/csr-focus/edit/:id', isAuthenticated, (req, res) => {
    const csrFocus = readJSON('csr-focus.json');
    const index = csrFocus.findIndex(c => c.id === parseInt(req.params.id));
    
    if (index !== -1) {
        // Handle image upload
        let image = req.body.image || csrFocus[index].image;
        if (req.files && req.files.imageFile) {
            const uploadedPath = handleImageUpload(req.files.imageFile, '/img/all-images/csr', 'csr-focus');
            if (uploadedPath) image = uploadedPath;
        }
        
        csrFocus[index] = {
            ...csrFocus[index],
            title: req.body.title,
            description: req.body.description,
            image: image,
            order: parseInt(req.body.order) || 1,
            published: req.body.published === 'on',
            updatedAt: new Date().toISOString().split('T')[0]
        };
        writeJSON('csr-focus.json', csrFocus);
    }
    
    res.redirect('/admin/csr-focus');
});

router.get('/csr-focus/delete/:id', isAuthenticated, (req, res) => {
    let csrFocus = readJSON('csr-focus.json');
    csrFocus = csrFocus.filter(c => c.id !== parseInt(req.params.id));
    writeJSON('csr-focus.json', csrFocus);
    res.redirect('/admin/csr-focus');
});

// Settings
router.get('/settings', isAuthenticated, (req, res) => {
    const settings = readJSON('settings.json');
    res.render('admin/settings', {
        layout: 'admin/layout',
        admin: req.session.admin,
        settings
    });
});

router.post('/settings', isAuthenticated, (req, res) => {
    const settings = readJSON('settings.json');
    
    settings.site = {
        ...settings.site,
        name: req.body.site_name,
        tagline: req.body.site_tagline,
        description: req.body.site_description,
        email: req.body.site_email,
        phone: req.body.site_phone,
        address: req.body.site_address,
        social: {
            instagram: req.body.social_instagram,
            tiktok: req.body.social_tiktok,
            youtube: req.body.social_youtube,
            shopee: req.body.social_shopee,
            tokopedia: req.body.social_tokopedia
        }
    };
    
    writeJSON('settings.json', settings);
    res.redirect('/admin/settings');
});

module.exports = router;
