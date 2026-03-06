// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>欢迎来到首页</h1>
      <p>这是任何人都可以看到的首页。</p>
      <Link to="/login" className={styles.loginButton}>
        去登录
      </Link>
    </div>
  );
}

export default Home;