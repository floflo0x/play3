module.exports = (req, res, next) => {
    // console.log(req.session.isLoggedIn == 'false' && !req.session.prodToken && !req.user?.remember_token);
    if(req.session.isLoggedIn == 'false' && !req.session.prodToken && !req.user?.remember_token) {
        return res.redirect("/login");
    }
    else return next();
}

    // <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
    // <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> 