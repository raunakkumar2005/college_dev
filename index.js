var express = require('express');
var ejs = require('ejs')
var sql = require('mysql');
var bodyparser = require('body-parser')
var multer = require('multer');
var session = require('express-session')
const Stripe = require('stripe')('sk_test_51MGxLuSHVbOeShqKiIqH8vFPzUm2tQFzDBYI3Co67INqwumlLQ7tjMjuF4mGH8i6BfLt0uFs3Z6I0vPUXS9B7EYM00YLxgJLNo');








var conn = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'node_project'
})

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }))
app.use(session({ secret: 'secret' }))


function isproductincart(cart, id) {

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id == id) {
            return true;
        }
    }

    return false;

}

function calculateTotal(cart, req) {
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total = total + (cart[i].price * cart[i].quantity)
    }

    req.session.total = total;
    return total
}

var upload = multer({ storage: multer.memoryStorage() })

app.post('/subscribe', (req, res) => {

    var email = req.body.email;

    conn.connect((e) => {
        if (e) throw e;

        var query = "INSERT INTO newsletter(email) VALUES('" + email + "')";
        conn.query(query, (err, result) => {
            if (err) throw err;
            res.send("you are subscribed to our news letter" + result.insertId);
        })
    })

})



app.post("/register", async (req, res) => {
    var email = req.body.email;
    var college = req.body.clg;
    var password = req.body.pass;
    var cpass = req.body.cpass;
    var fname = req.body.fname;
    var lname = req.body.lname;
    var gender = req.body.mygender;
    var year = req.body.sem;
    var roll = req.body.roll;
    var age = req.body.age;
    var course = req.body.Course;





    var query = "INSERT INTO user(first_name,last_name,Email,Password,Confirmpass,Gender,Age,College,college_roll_no,Course,Year) VALUES('" + fname + "','" + lname + "','" + email + "','" + password + "','" + cpass + "','" + gender + "','" + age + "','" + college + "','" + roll + "','" + course + "','" + year + "')";
    conn.query(query, (err, result) => {
        if (err) {
            res.send('Roll number already registered')
        };
        res.redirect('/login');

    })
})


app.post('/login', (req, res) => {
    var email = req.body.email;
    var roll = req.body.roll;

    conn.query('SELECT * FROM user WHERE Email = ? and college_roll_no = ?', [email, roll], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            var user = JSON.parse(JSON.stringify(result[0]))
            req.session.user = user;
            res.redirect('/profile');

        } else {
            res.send('Invalid credentials')
        }
    })
})


app.post('/add_to_cart', (req, res) => {
    var name = req.body.name
    var quantity = req.body.quantity
    var id = req.body.id
    var price = req.body.price
    var image = req.body.image
    var product = { id: id, name: name, price: price, quantity: quantity, image: image }
    //console.log(product)

    if (req.session.cart) {
        var cart = req.session.cart;

        if (!isproductincart(cart, id)) {
            cart.push(product);
        }
    } else {

        req.session.cart = [product];
        var cart = req.session.cart;
    }

    calculateTotal(cart, req);

    res.redirect('/cart');
})

app.post('/remove_product', (req, res) => {
    console.log(req.body);
    var id = req.body.id;
    var cart = req.session.cart;

    for (let i = 0; i < cart.length; i++) {

        if (cart[i].id == id) {
            cart.splice(cart.indexOf(i), 1);
        }
    }

    calculateTotal(cart, req);
    res.redirect('/cart')
})

app.post('/edit_product', (req, res) => {
    var id = req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.addbtn;
    var decrease_btn = req.body.removebtn

    //console.log(req.body);

    var cart = req.session.cart;
    if (increase_btn) {
        // console.log(increase_btn);
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id == id) {
                if (cart[i].quantity > 0) {
                    cart[i].quantity = parseInt(cart[i].quantity) + 1;
                }
            }
        }
    }

    if (decrease_btn) {
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id == id) {
                if (cart[i].quantity > 1) {
                    cart[i].quantity = parseInt(cart[i].quantity) - 1;
                }
            }
        }
    }

    calculateTotal(cart, req);
    res.redirect('/cart');
})

app.post('/create-checkout-session', async (req, res) => {

    var cart = req.session.cart;

    const params = {
        submit_type: 'pay',
        mode: 'payment',
        payment_method_types: ['card'],
        billing_address_collection: 'auto',

        line_items: cart.map((item) => {
            const img = item.image;


            return {
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.name,
                        images: [img],
                    },
                    unit_amount: item.price * 100,
                },
                adjustable_quantity: {
                    enabled: true,
                    minimum: 1,
                },
                quantity: item.quantity
            }
        }),

        success_url: `http://localhost:7000/success`,
        cancel_url: `http://localhost:7000/canceled`,

    }

    const session = await Stripe.checkout.sessions.create(params);

    res.redirect(303, session.url);
});

app.post('/contact', (req, res) => {

    var email = req.body.email;
    var name = req.body.name;
    var message = req.body.message;

    var query = "INSERT INTO contact(Name,email,message) VALUES('" + name + "','" + email + "','" + message + "')";

    conn.query(query, (err, result) => {
        if (err) throw err;

    })

    res.redirect('/contact')

})


app.get('/login', (req, res) => {
    res.render('pages/login');
})

app.get('/', (req, res) => {
    var user = req.session.user
    conn.query("SELECT * FROM products", (err, result) => {
        res.render('pages/index', { result: result, user: user });
    })

})

app.get('/register', (req, res) => {
    res.render('pages/register');
})

app.get('/blogs', (req, res) => {
    res.render('pages/blog');
})

app.get('/logout', (req, res) => {
    res.redirect('/login');
})


app.get('/cart', (req, res) => {
    var cart = req.session.cart;
    var total = req.session.total;
    //console.log(cart.length);

    //console.log(cart)

    res.render('pages/cart', { cart: cart, total: total });
})

app.get('/success', (req, res) => {
    res.render('pages/success');
})

app.get('/cancelled', (req, res) => {
    res.render('pages/cancelled');
})

app.get('/contact', (req, res) => {
    res.render('pages/contact');
})

app.get('/trade', (req, res) => {
    conn.query("SELECT * FROM products", (err, result) => {
        res.render('pages/shop', { result: result });
    })
})

app.get('/about', (req, res) => {
    res.render('pages/about')
})

app.get('/courses', (req, res) => {
    res.render('pages/courses');
})

app.get('/profile', (req, res) => {
    var user = req.session.user;

    res.render('pages/profile', { user: user })
})

app.listen(7000, () => {
    console.log('server is running at http://localhost:7000')
})
