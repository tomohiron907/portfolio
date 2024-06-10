import { useRef } from "react";
import "./portfolio.scss";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const items = [
  {
    id: 1,
    title: "G-coordinator",
    img: "/portfolio/G-coordinator.jpg",
    desc: "Pythonを用いて，3Dプリンタを制御するためのG-codeを生成するオープンソースソフトウェア．造形と印刷設定を同時に行うことができ，今までにできなかった形状の実現や印刷設定の精密な制御が可能になった．",
  },
  {
    id: 2,
    title: "3DPrint with G-coordinator",
    img: "/portfolio/koch_pot.jpg",
    desc: "自分が開発したソフトウェアを使って，様々なものを3Dプリント．従来のCADなどでは作成が難しいフラクタル形状などもG-coordinatorを用いて造形すれば簡単に実現できる．",
  },
  {
    id: 3,
    title: "Structure Color Wall",
    img: "/portfolio/wave_wall.gif",
    desc: "二色のフィラメントを用いて，昆虫の羽のように構造色を持つ壁を3Dプリント．構造色を実現するためのデータはG-coordinatorを用いて生成し，3Dプリンタで造形．",
  },
  {
    id: 4,
    title: "Focus: Self Made Keyboard",
    img: "/portfolio/focus.jpg",
    desc: "自分の指の長さや可動域にあわせて回路設計から行った自作キーボード．ファームウェア，設計データともにオープンソース化．",
  },
  {
    id: 5,
    title: "Logistics",
    img: "/portfolio/logistics.png",
    desc: "赤丸と青丸が，誕生，繁殖，死亡のサイクルを繰り返す生物のシミュレーション．生物の行動はランダムであり，生物の数が増えると生物同士の競争が激しくなり，生物の数が減少する様子や，増減を繰り返して収束する様子など，実際の生物に近しい現象が観察される．",
  },
];

const Single = ({ item }) => {
  const ref = useRef();

  const { scrollYProgress } = useScroll({
    target: ref,
  });

  const y = useTransform(scrollYProgress, [0, 1], [-300, 300]);

  return (
    <section >
      <div className="container">
        <div className="wrapper">
          <div className="imageContainer" ref={ref}>
            <img src={item.img} alt="" />
          </div>
          <motion.div className="textContainer" style={{y}}>
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <button>See Demo</button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Portfolio = () => {
  const ref = useRef();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "start start"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  return (
    <div className="portfolio" ref={ref}>
      <div className="progress">
        <h1>Featured Works</h1>
        <motion.div style={{ scaleX }} className="progressBar"></motion.div>
      </div>
      {items.map((item) => (
        <Single item={item} key={item.id} />
      ))}
    </div>
  );
};

export default Portfolio;
