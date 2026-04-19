import {
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { travelApi } from "../api";
import { useTravelApp } from "../context/useTravelApp";
import {
  getPasswordVisibilityToggleMeta,
  getRegisterPasswordMatchError,
  getRegisterPasswordValidationErrors,
  getRegisterUsernameHint,
} from "../lib/authValidation";

function buildCaptchaSrc(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useParams();
  const currentMode = mode === "register" ? "register" : "login";
  const from = new URLSearchParams(location.search).get("from") || "/profile";
  const switchLinkSearch = useMemo(
    () => `?from=${encodeURIComponent(from)}`,
    [from],
  );
  const {
    authBusy,
    authCaptcha,
    authCaptchaLoading,
    authForm,
    clearError,
    error,
    handleAuthSubmit,
    refreshAuthCaptcha,
    setAuthField,
    setAuthMode,
    user,
  } = useTravelApp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameHint, setUsernameHint] = useState("");

  useEffect(() => {
    setAuthMode(currentMode);
  }, [currentMode]);

  useEffect(() => {
    void refreshAuthCaptcha();
  }, [currentMode]);

  useEffect(() => {
    if (!user) {
      return;
    }

    navigate(from, { replace: true });
  }, [from, navigate, user]);

  useEffect(() => {
    if (currentMode !== "register") {
      setShowConfirmPassword(false);
      setUsernameHint("");
    }
  }, [currentMode]);

  useEffect(() => {
    const username = authForm.username.trim();

    if (currentMode !== "register" || username.length < 3) {
      setUsernameHint("");
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const availability = await travelApi.checkUsernameAvailability(username);

        if (!cancelled) {
          setUsernameHint(getRegisterUsernameHint(username, availability));
        }
      } catch {
        if (!cancelled) {
          setUsernameHint("");
        }
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authForm.username, currentMode]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  const title = currentMode === "login" ? "登录账号" : "注册账号";
  const subtitle =
    currentMode === "login"
      ? "登录后可同步收藏点位、保存行程偏好，并继续使用文化遗产导览工作台。"
      : null;
  const passwordVisibilityToggle = getPasswordVisibilityToggleMeta(showPassword);
  const confirmPasswordVisibilityToggle =
    getPasswordVisibilityToggleMeta(showConfirmPassword);
  const registerPasswordErrors =
    currentMode === "register"
      ? getRegisterPasswordValidationErrors(authForm.password)
      : [];
  const registerPasswordHint =
    currentMode !== "register"
      ? ""
      : authForm.password
        ? registerPasswordErrors[0] ?? "当前密码强度符合要求，可以用于注册。"
        : "注册密码需为 12-72 位，并包含大小写字母、数字和特殊字符。";
  const confirmPasswordHint =
    currentMode !== "register"
      ? ""
      : authForm.confirmPassword
        ? getRegisterPasswordMatchError(
            authForm.password,
            authForm.confirmPassword,
          ) || "两次输入一致，可以继续注册。"
        : "请再输入一次相同密码，提交前会自动校验。";

  return (
    <div className="auth-page">
      <div className="auth-page__shell">
        <div className="auth-page__intro">
          <span className="auth-page__kicker">账号中心</span>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          <Link className="auth-page__back" to={from}>
            <ArrowLeft className="icon-4" />
            返回上一页
          </Link>
        </div>

        <section className="auth-panel">
          <div className="auth-panel__switch">
            <Link
              className={
                currentMode === "login" ? "chip-button active" : "chip-button"
              }
              to={`/auth/login${switchLinkSearch}`}
            >
              <LogIn className="icon-4" />
              登录
            </Link>
            <Link
              className={
                currentMode === "register"
                  ? "chip-button active"
                  : "chip-button"
              }
              to={`/auth/register${switchLinkSearch}`}
            >
              <UserPlus className="icon-4" />
              注册
            </Link>
          </div>

          <form
            className="auth-panel__form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAuthSubmit();
            }}
          >
            <label className="auth-field">
              <span>用户名</span>
              <input
                autoComplete="username"
                onChange={(event) => setAuthField("username", event.target.value)}
                placeholder="请输入用户名"
                type="text"
                value={authForm.username}
              />
              {currentMode === "register" && usernameHint ? (
                <small className="auth-field__hint auth-field__hint--warning">
                  {usernameHint}
                </small>
              ) : null}
            </label>

            <label className="auth-field">
              <span>密码</span>
              <div className="auth-field__input-wrap">
                <input
                  autoComplete={
                    currentMode === "login" ? "current-password" : "new-password"
                  }
                  onChange={(event) => setAuthField("password", event.target.value)}
                  placeholder={
                    currentMode === "login"
                      ? "请输入登录密码"
                      : "请输入 12-72 位高强度密码"
                  }
                  type={passwordVisibilityToggle.inputType}
                  value={authForm.password}
                />
                <button
                  aria-label={passwordVisibilityToggle.label}
                  className="auth-field__toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  title={passwordVisibilityToggle.label}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="icon-4" />
                  ) : (
                    <Eye className="icon-4" />
                  )}
                  <small className="auth-field__toggle-text">
                    {showPassword ? "隐藏" : "显示"}
                  </small>
                </button>
              </div>
              {currentMode === "register" ? (
                <small className="auth-field__hint">{registerPasswordHint}</small>
              ) : null}
            </label>

            {currentMode === "register" ? (
              <label className="auth-field">
                <span>确认密码</span>
                <div className="auth-field__input-wrap">
                  <input
                    autoComplete="new-password"
                    onChange={(event) =>
                      setAuthField("confirmPassword", event.target.value)
                    }
                    placeholder="请再次输入相同密码"
                    type={confirmPasswordVisibilityToggle.inputType}
                    value={authForm.confirmPassword}
                  />
                  <button
                    aria-label={confirmPasswordVisibilityToggle.label}
                    className="auth-field__toggle"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    title={confirmPasswordVisibilityToggle.label}
                    type="button"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="icon-4" />
                    ) : (
                      <Eye className="icon-4" />
                    )}
                    <small className="auth-field__toggle-text">
                      {showConfirmPassword ? "隐藏" : "显示"}
                    </small>
                  </button>
                </div>
                <small className="auth-field__hint">{confirmPasswordHint}</small>
              </label>
            ) : null}

            <div className="auth-field auth-field--captcha">
              <label>
                <span>验证码</span>
                <input
                  autoComplete="off"
                  inputMode="text"
                  maxLength={8}
                  onChange={(event) =>
                    setAuthField(
                      "captchaCode",
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="输入图中字符"
                  type="text"
                  value={authForm.captchaCode}
                />
              </label>

              <div className="auth-captcha">
                <div className="auth-captcha__image">
                  {authCaptcha ? (
                    <img alt="验证码" src={buildCaptchaSrc(authCaptcha.svg)} />
                  ) : (
                    <div className="auth-captcha__placeholder">
                      {authCaptchaLoading
                        ? "正在生成验证码..."
                        : "验证码加载失败"}
                    </div>
                  )}
                </div>

                <button
                  className="button-secondary auth-captcha__refresh"
                  disabled={authCaptchaLoading}
                  onClick={() => void refreshAuthCaptcha()}
                  type="button"
                >
                  <RefreshCw className="icon-4" />
                  换一张
                </button>
              </div>

              <small className="auth-field__hint">
                {authCaptcha
                  ? `${Math.max(
                      1,
                      Math.floor(authCaptcha.expiresInSeconds / 60),
                    )} 分钟内有效，提交后会自动失效。`
                  : "验证码由服务端生成，用于防止批量注册和撞库请求。"}
              </small>
            </div>

            {error ? <div className="notice notice--error">{error}</div> : null}

            <div className="auth-panel__actions">
              <button
                className="button-primary"
                disabled={authBusy || authCaptchaLoading}
                type="submit"
              >
                <ShieldCheck className="icon-5" />
                {authBusy
                  ? "提交中..."
                  : currentMode === "login"
                    ? "登录并继续"
                    : "注册并开始使用"}
              </button>
              <Link className="button-secondary" to={from}>
                先返回
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
