import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import styles from "./Login.module.css";
import Colors from "../../themes/Colors";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { Hamburger, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { UserService } from "../../service/user.service";
import { UserRole } from "../../dtos/enums/user-role.enum";
type Props = {
  backgroundImageUrl?: string;
  onSubmit?: (data: {
    email: string;
    password: string;
    remember: boolean;
  }) => void;
};

type LoginCssVars = CSSProperties & {
  "--bgPrimary": string;
  "--bgSecondary": string;
  "--highlight": string;
  "--textPrimary": string;
  "--textSecondary": string;
  "--heroImage": string;
};

export default function Login({
  backgroundImageUrl = "/login-banner-desktop.png",
  onSubmit,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { login: contextLogin } = useAuth();

  async function login() {
    if (isLoggingIn) {
      return;
    }

    setError(null);
    setIsLoggingIn(true);

    try {
      const payload = { email, password };

      const data = await UserService.login(payload);

      if (data.role === UserRole.ADMIN) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);

        contextLogin(data.token);

        navigate("/dashboard");
      } else {
        setError("Esta conta não tem acesso à administração.");
      }
    } catch {
      setError("Confira seu e-mail e sua senha e tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit?.({ email, password, remember });
    await login();
  }

  return (
    <div
      className={styles.page}
      style={
        {
          "--bgPrimary": Colors.Background.primary,
          "--bgSecondary": Colors.Background.secondary,
          "--highlight": Colors.Highlight.primary,
          "--textPrimary": Colors.Texts.primary,
          "--textSecondary": Colors.Texts.secondary,
          "--heroImage": `url(${backgroundImageUrl})`,
        } as LoginCssVars
      }
    >
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Hamburger aria-hidden="true" />
            <div><strong>Burguer</strong><span>Hamburgueria</span></div>
          </div>
          <span className={styles.adminLabel}><ShieldCheck size={16} aria-hidden="true" />Painel administrativo</span>
        </div>
      </header>

      <main className={styles.content} data-enter="page">
        <div className={styles.intro}>
          <h1>Bem-vindo<span>de volta!</span></h1>
          <p>Seus pedidos, produtos e clientes.<br />Tudo em um só lugar.</p>
        </div>

        <section className={styles.loginWrap} aria-labelledby="admin-login-title">
          <div className={`${styles.brand} ${styles.formBrand}`}>
            <Hamburger aria-hidden="true" />
            <div><strong>Burguer</strong><span>Administração</span></div>
          </div>
          <h2 id="admin-login-title" className={styles.panelTitle}>Entrar no painel</h2>
          <p className={styles.panelSub}>Acesse sua conta para gerenciar a loja.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>E-mail</span>
              <span className={styles.inputWrap}>
                <FiMail aria-hidden="true" />
                <input className={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" type="email" autoComplete="username" required />
              </span>
            </label>
            <label className={styles.field}>
              <span>Senha</span>
              <span className={styles.inputWrap}>
                <FiLock aria-hidden="true" />
                <input className={styles.input} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" type={showPass ? "text" : "password"} autoComplete="current-password" required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((current) => !current)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </span>
            </label>

            <label className={styles.check}>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Manter conectado</span>
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.submit} type="submit" disabled={isLoggingIn} aria-busy={isLoggingIn}>
              {isLoggingIn ? <><span className={styles.loader} aria-hidden="true" />Entrando...</> : <>Entrar no painel<FiArrowRight aria-hidden="true" /></>}
            </button>
          </form>
          <p className={styles.secureLabel}><ShieldCheck size={15} aria-hidden="true" />Acesso exclusivo da administração</p>
        </section>
      </main>
    </div>
  );
}
