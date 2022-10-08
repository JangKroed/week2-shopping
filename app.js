const express = require("express");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const User = require("./models/user");
// const Goods = require("./models/goods");
// const Cart = require("./models/cart");

/**
 * Sequelize 모델 불러오기
 */
const { Op } = require("sequelize");
const { User, Cart, Goods } = require("./models");

const authMiddleware = require("./middlewares/auth-middleware");

// mongoose.connect("mongodb://localhost/shopping-demo", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

/**
 * Sequelize  회원가입
 */
router.post("/users", async (req, res) => {
  const { email, nickname, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).send({
      errorMessage: "패스워드가 패스워드 확인란과 다릅니다.",
    });
    return;
  }

  // email or nickname이 동일한게 이미 있는지 확인하기 위해 가져온다.
  const existsUsers = await User.findAll({
    where: {
      [Op.or]: [{ email }, { nickname }],
    },
  });
  if (existsUsers.length) {
    res.status(400).send({
      errorMessage: "이메일 또는 닉네임이 이미 사용중입니다.",
    });
    return;
  }

  await User.create({ email, nickname, password });
  res.status(201).send({});
});

/**
 * 회원가입 API
 */
// router.post("/users", async (req, res) => {
//   const { nickname, email, password, confirmPassword } = req.body;

//   if (password !== confirmPassword) {
//     res.status(400).send({
//       errorMessage: "패스워드가 패스워드 확인란과 동일하지 않습니다.",
//     });
//     return;
//   }
//   // email or nickname의 중복여부 // find 외안됨??
//   const existUsers = await User.findOne({
//     $or: [{ email }, { nickname }],
//   });

//   if (existUsers) {
//     // 보안을 위해 인증메세지는 자세히 설명하지 않는다.
//     res
//       .status(400)
//       .send({ errorMessage: "이미 가입된 이메일 또는 닉네임이 있습니다." });
//     return;
//   }

//   const user = new User({ email, nickname, password });
//   await user.save();

//   res.status(201).send({});
// });

/**
 * Sequelize 로그인 (DB에서 가져오는 부분만 수정)
 */
router.post("/auth", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: {
      email,
    },
  });

  // NOTE: 인증 메세지는 자세히 설명하지 않는것을 원칙
  if (!user || password !== user.password) {
    res.status(400).send({
      errorMessage: "이메일 또는 패스워드가 틀렸습니다.",
    });
    return;
  }

  res.send({
    token: jwt.sign({ userId: user.userId }, "customized-secret-key"),
  });
});

/**
 * 로그인, 토큰 생성
 */
// router.post("/auth", async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email, password }).exec();

//   if (!user) {
//     res.status(400).send({
//       errorMessage: "이메일 또는 패스워드가 잘못됐습니다.",
//     });
//     return;
//   }

//   const token = jwt.sign({ userId: user.userId }, "MySecretKey");
//   res.send({ token });
// });

/**
 * Sequelize 토큰 생성
 */
router.post("/auth", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email, password } });

  if (!user) {
    res.status(400).send({
      errorMessage: "이메일 또는 패스워드가 잘못됐습니다.",
    });
    return;
  }

  const token = jwt.sign({ userId: user.userId }, "customized-secret-key");
  res.send({
    token,
  });
});

/**
 * 로그인 토큰 검증
 */
// router.get("/users/me", authMiddleware, async (req, res) => {
//   const { user } = res.locals;
//   res.send({
//     user: {
//       email: user.email,
//       nickname: user.nickname,
//     },
//   });
// });

/**
 * Sequelize 토큰 검증
 */
router.get("/users/me", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  res.send({
    user,
  });
});

/**
 * 내가 가진 장바구니 목록을 전부 불러온다.
 */
// router.get("/goods/cart", authMiddleware, async (req, res) => {
//   const { userId } = res.locals.user;

//   const cart = await Cart.find({
//     userId,
//   }).exec();

//   const goodsIds = cart.map((c) => c.goodsId);

//   // 루프 줄이기 위해 Mapping 가능한 객체로 만든것
//   const goodsKeyById = await Goods.find({
//     where: {
//       goodsId: goodsIds,
//     },
//   })
//     .exec()
//     .then((goods) =>
//       goods.reduce(
//         (prev, g) => ({
//           ...prev,
//           [g.goodsId]: g,
//         }),
//         {}
//       )
//     );

//   res.send({
//     cart: cart.map((c) => ({
//       quantity: c.quantity,
//       goods: goodsKeyById[c.goodsId],
//     })),
//   });
// });

/**
 * Sequelize 장바구니 목록 조회
 */
router.get("/goods/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;

  const cart = await Cart.findAll({
    where: {
      userId,
    },
  });

  const goodsIds = cart.map((c) => c.goodsId);

  // 루프 줄이기 위해 Mapping 가능한 객체로 만든것
  const goodsKeyById = await Goods.findAll({
    where: {
      goodsId: goodsIds,
    },
  }).then((goods) =>
    goods.reduce(
      (prev, g) => ({
        ...prev,
        [g.goodsId]: g,
      }),
      {}
    )
  );

  res.send({
    cart: cart.map((c) => ({
      quantity: c.quantity,
      goods: goodsKeyById[c.goodsId],
    })),
  });
});

/**
 * 장바구니에 상품 담기.
 * 장바구니에 상품이 이미 담겨있으면 갯수만 수정한다.
 */
// router.put("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
//   const { userId } = res.locals.user;
//   const { goodsId } = req.params;
//   const { quantity } = req.body;

//   const existsCart = await Cart.findOne({
//     userId,
//     goodsId,
//   }).exec();

//   if (existsCart) {
//     existsCart.quantity = quantity;
//     await existsCart.save();
//   } else {
//     const cart = new Cart({
//       userId,
//       goodsId,
//       quantity,
//     });
//     await cart.save();
//   }

//   // NOTE: 성공했을때 딱히 정해진 응답 값이 없다.
//   res.send({});
// });

/**
 * Sequelize 장바구니 상품 담기
 */
router.put("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;
  const { quantity } = req.body;

  const existsCart = await Cart.findOne({
    where: {
      userId,
      goodsId,
    },
  });

  if (existsCart) {
    existsCart.quantity = quantity;
    await existsCart.save();
  } else {
    await Cart.create({
      userId,
      goodsId,
      quantity,
    });
  }

  // NOTE: 성공했을때 응답 값을 클라이언트가 사용하지 않는다.
  res.send({});
});

/**
 * 장바구니 항목 삭제
 */
// router.delete("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
//   const { userId } = res.locals.user;
//   const { goodsId } = req.params;

//   const existsCart = await Cart.findOne({
//     userId,
//     goodsId,
//   }).exec();

//   // 있든 말든 신경 안쓴다. 그냥 있으면 지운다.
//   if (existsCart) {
//     await existsCart.delete().exec();
//   }

//   // NOTE: 성공했을때 딱히 정해진 응답 값이 없다.
//   res.send({});
// });

/**
 * Sequelize 장바구니 항목 삭제
 */
router.delete("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;

  const existsCart = await Cart.findOne({
    where: {
      userId,
      goodsId,
    },
  });

  // 있든 말든 신경 안쓴다. 그냥 있으면 지운다.
  if (existsCart) {
    await existsCart.destroy();
  }

  // NOTE: 성공했을때 딱히 정해진 응답 값이 없다.
  res.send({});
});

/**
 * Sequelize 모든 상품 가져오기
 */
router.get("/goods", authMiddleware, async (req, res) => {
  const { category } = req.query;
  const goods = await Goods.findAll({
    order: [["goodsId", "DESC"]],
    where: category ? { category } : undefined,
  });

  res.send({ goods });
});

/**
 * 모든 상품 가져오기
 * 상품도 몇개 없는 우리에겐 페이지네이션은 사치다.
 * @example
 * /api/goods
 * /api/goods?category=drink
 * /api/goods?category=drink2
 */
// router.get("/goods", authMiddleware, async (req, res) => {
//   const { category } = req.query;
//   const goods = await Goods.find(category ? { category } : undefined)
//     .sort("-date")
//     .exec();

//   res.send({ goods });
// });

/**
 * 상품 하나만 가져오기
 */
// router.get("/goods/:goodsId", authMiddleware, async (req, res) => {
//   const { goodsId } = req.params;
//   const goods = await Goods.findById(goodsId).exec();

//   if (!goods) {
//     res.status(404).send({});
//   } else {
//     res.send({ goods });
//   }
// });

/**
 * Sequelize 상품 하나만 가져오기
 */
router.get("/goods/:goodsId", authMiddleware, async (req, res) => {
  const { goodsId } = req.params;
  const goods = await Goods.findByPk(goodsId);

  if (!goods) {
    res.status(404).send({});
  } else {
    res.send({ goods });
  }
});

/**
 * Sequelize 상품 등록하기
 */
router.post("/goods", authMiddleware, async (req, res) => {
  const { goodsId, name, thumbnailUrl, category, price } = req.body;

  const goods = await Goods.findByPk(goodsId);
  if (goods) {
    return res
      .status(400)
      .json({ success: false, errorMessage: "이미 있는 데이터입니다." });
  }

  const createdGoods = await Goods.create({
    goodsId,
    name,
    thumbnailUrl,
    category,
    price,
  });

  res.status(201).json({ goods: createdGoods });
});

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});
