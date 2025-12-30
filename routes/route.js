
const express = require('express');
const route = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data');

const readJSON = (filename) => {
    const filePath = path.join(dataPath, filename);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
};

// Home (using index5 layout)
route.get('/', (req, res, next) => {
  const settings = readJSON('settings.json');
  const testimonials = readJSON('testimonials.json').filter(t => t.published);
  const services = readJSON('services.json').filter(s => s.published).sort((a, b) => a.order - b.order);
  const projects = readJSON('projects.json').filter(p => p.published).sort((a, b) => a.order - b.order);
  const projectCategories = readJSON('project-categories.json');
  const articles = readJSON('articles.json').filter(a => a.published).slice(0, 4);
  res.render('index5', { layout: 'partials/base', settings, testimonials, services, projects, projectCategories, articles });
})

// Profile
route.get('/profile', (req, res, next) => {
  const settings = readJSON('settings.json');
  res.render('profile', { layout: 'partials/base', settings });
})

// History
route.get('/history', (req, res, next) => {
  const settings = readJSON('settings.json');
  const services = readJSON('services.json').filter(s => s.published).sort((a, b) => a.order - b.order);
  res.render('history', { layout: 'partials/base', settings, products: services });
})

// Produk
route.get('/produk', (req, res, next) => {
  const settings = readJSON('settings.json');
  const services = readJSON('services.json').filter(s => s.published).sort((a, b) => a.order - b.order);
  const categories = readJSON('service-categories.json');
  res.render('produk', { layout: 'partials/base', settings, services, categories });
})

// Project List
route.get('/project', (req, res, next) => {
  const settings = readJSON('settings.json');
  const projects = readJSON('projects.json').filter(p => p.published).sort((a, b) => a.order - b.order);
  const categories = readJSON('project-categories.json');
  const tags = readJSON('project-tags.json');
  res.render('project-list', { layout: 'partials/base', settings, projects, categories, tags });
})

// Project Single
route.get('/project/:slug', (req, res, next) => {
  const settings = readJSON('settings.json');
  const projects = readJSON('projects.json');
  const project = projects.find(p => p.slug === req.params.slug && p.published);
  
  if (!project) {
    return res.status(404).render('404', { layout: 'partials/base', settings });
  }
  
  const categories = readJSON('project-categories.json');
  const tags = readJSON('project-tags.json');
  const category = categories.find(c => c.id === project.categoryId);
  const projectTags = tags.filter(t => project.tags && project.tags.includes(t.id));
  const relatedProjects = projects.filter(p => p.published && p.id !== project.id && p.categoryId === project.categoryId).slice(0, 3);
  
  res.render('project-single', { 
    layout: 'partials/base', 
    settings, 
    project, 
    category, 
    projectTags, 
    relatedProjects 
  });
})

// Produk/Service List
route.get('/produk/list', (req, res, next) => {
  const settings = readJSON('settings.json');
  const services = readJSON('services.json').filter(s => s.published).sort((a, b) => a.order - b.order);
  const categories = readJSON('service-categories.json');
  const tags = readJSON('service-tags.json');
  res.render('layanan', { layout: 'partials/base', settings, services, categories, tags });
})

// Produk/Service Single
route.get('/produk/:slug', (req, res, next) => {
  const settings = readJSON('settings.json');
  const services = readJSON('services.json');
  const service = services.find(s => s.slug === req.params.slug && s.published);
  
  if (!service) {
    return res.status(404).render('404', { layout: 'partials/base', settings });
  }
  
  const categories = readJSON('service-categories.json');
  const tags = readJSON('service-tags.json');
  const category = categories.find(c => c.id === service.categoryId);
  const serviceTags = tags.filter(t => service.tags && service.tags.includes(t.id));
  const relatedServices = services.filter(s => s.published && s.id !== service.id && s.categoryId === service.categoryId).slice(0, 3);
  
  res.render('layanan-single', { 
    layout: 'partials/base', 
    settings, 
    service, 
    category, 
    serviceTags, 
    relatedServices 
  });
})

// News & Event
route.get('/news', (req, res, next) => {
  const settings = readJSON('settings.json');
  const articles = readJSON('articles.json').filter(a => a.published);
  res.render('news', { layout: 'partials/base', settings, articles });
})

// News Detail
route.get('/news/:slug', (req, res, next) => {
  const settings = readJSON('settings.json');
  const articles = readJSON('articles.json').filter(a => a.published);
  const article = articles.find(a => a.slug === req.params.slug);
  
  if (!article) {
    return res.status(404).render('404', { layout: 'partials/base', settings });
  }
  
  const relatedArticles = articles.filter(a => a.id !== article.id && a.category === article.category).slice(0, 3);
  res.render('news-detail', { layout: 'partials/base', settings, article, relatedArticles });
})

// Contact Us
route.get('/contact', (req, res, next) => {
  const settings = readJSON('settings.json');
  res.render('contact', { settings });
})

// Contact Us (New Page with proper header)
route.get('/contact-us', (req, res, next) => {
  const settings = readJSON('settings.json');
  res.render('contact-us', { settings });
})

// CSR
route.get('/csr', (req, res, next) => {
  const settings = readJSON('settings.json');
  res.render('csr', { layout: 'partials/base', settings });
})

// Business Card Profile (tidak ada di menu, untuk kartu nama)
route.get('/card/:slug', (req, res, next) => {
  const cards = readJSON('cards.json');
  const card = cards.find(c => c.slug === req.params.slug && c.published);
  
  if (!card) {
    return res.status(404).render('404');
  }
  
  res.render('card', { layout: false, card });
})

route.get('/404', (req, res, next) => {
  res.render('404');
})

route.get('/about', (req, res, next) => {
  res.render('about');
})

route.get('/blog-left', (req, res, next) => {
  res.render('blog-left');
})

route.get('/blog-right', (req, res, next) => {
  res.render('blog-right');
})

route.get('/blog-single', (req, res, next) => {
  res.render('blog-single');
})

route.get('/blog', (req, res, next) => {
  res.render('blog');
})

route.get('/contact', (req, res, next) => {
  res.render('contact');
})

route.get('/faq', (req, res, next) => {
  res.render('faq');
})

route.get('/index', (req, res, next) => {
  res.render('index');
})

route.get('/index2', (req, res, next) => {
  res.render('index2', {layout: 'partials/base'});
})

route.get('/index3', (req, res, next) => {
  res.render('index3', {layout: 'partials/base'});
})

route.get('/index4', (req, res, next) => {
  res.render('index4', {layout: 'partials/base'});
})

route.get('/index5', (req, res, next) => {
  res.render('index5', {layout: 'partials/base'});
})

route.get('/pricing', (req, res, next) => {
  res.render('pricing');
})

route.get('/project-left', (req, res, next) => {
  res.render('project-left');
})

route.get('/project-right', (req, res, next) => {
  res.render('project-right');
})

route.get('/project-single', (req, res, next) => {
  res.render('project-single');
})

route.get('/project', (req, res, next) => {
  res.render('project');
})

route.get('/service-left', (req, res, next) => {
  res.render('service-left');
})

route.get('/service-right', (req, res, next) => {
  res.render('service-right');
})

route.get('/service-single', (req, res, next) => {
  res.render('service-single');
})

route.get('/service', (req, res, next) => {
  res.render('service');
})

route.get('/team', (req, res, next) => {
  res.render('team');
})

route.get('/testimonial', (req, res, next) => {
  res.render('testimonial');
})

module.exports = route