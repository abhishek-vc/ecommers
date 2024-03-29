const multer = require('multer');

const storageProduct = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/productImgs/');
    },
    filename: function (req, file, cb) {
        const date = Date.now();
        req.body.datestemp = date;
        cb(null, req.body.productName + '-' + date + '-' + file.originalname);
    }
});

const storageUserImg = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/userImgs/');
    },
    filename: function (req, file, cb) {
        const ex = file.originalname.substr(file.originalname.lastIndexOf('.'));
        const date = Date.now();
        req.body.datestemp = date;
        cb(null, req.user.email + '-' + date + ex);
    }
});

const ProductStore = multer({ storage: storageProduct });
const UserImgStore = multer({ storage: storageUserImg });

module.exports = {
    ProductStore,
    UserImgStore,
};