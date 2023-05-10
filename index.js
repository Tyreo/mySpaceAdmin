const Koa = require("koa");
const app = new Koa();
const bodyParser = require("koa-bodyparser");
const router = require("./router");
const nunjucks = require("koa-nunjucks-2");
const path = require("path");
const koaStatic = require("koa-static");
const util = require("./util/util");
const axios = require("axios");

app.use(koaStatic(path.resolve(__dirname, "public")));

app.use(
  nunjucks({
    ext: "html",
    path: path.join(__dirname, "views"),
    nunjucksConfig: {
      trimBlocks: true,
    },
  })
);

app.use(bodyParser());

// 鉴权中间件
app.use(async (ctx, next) => {
  let _match =
    ["/login", "/qrcode", "/token", "/check"].indexOf(ctx.request.path) >= 0;

  if (!_match) {
    let token = util.getToken(ctx);
    if (!token) {
      util.redirectToLogin(ctx);
    } else {
      let res = await axios.get("https://api.syreo.cn/my", {
        headers: { "x-session": token },
      });
      if (res.data.data && res.data.data.isAdmin) {
        ctx.state.token = token;
        await next();
      } else {
        util.redirectToLogin(ctx);
      }
    }
  } else {
    await next();
  }
});
// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.log("error", error.message);
  }
});
router(app);
app.listen(5001);
console.log("app start at 5001");
