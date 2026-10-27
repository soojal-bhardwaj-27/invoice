"use client";
import {useEffect, useState} from "react";
import {api} from "./api";

export default function AuthScreen({onAuthenticated}) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({email: "", password: "", full_name: "", new_password: ""});
  const [reset, setReset] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("reset_uid") && params.has("reset_token")) {
      setReset({uid: params.get("reset_uid"), token: params.get("reset_token")}); setMode("reset");
    }
  }, []);
  const titles = {login: "Welcome back", register: "Your invoices, organized", forgot: "Reset your password", reset: "Choose a new password"};
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "forgot") {
        const data = await api("/api/auth/request-password-reset/", {method: "POST", body: JSON.stringify({email: form.email})});
        setNotice(data.detail);
      } else if (mode === "reset") {
        const data = await api("/api/auth/reset-password/", {method: "POST", body: JSON.stringify({...reset, new_password: form.new_password})});
        window.history.replaceState({}, "", "/app"); setMode("login"); setNotice(data.detail);
      } else {
        const data = await api("/api/auth/" + mode + "/", {method: "POST", body: JSON.stringify(form)});
        onAuthenticated(data.user);
      }
    } catch (err) {setError(err.message)} finally {setBusy(false)}
  }
  function field(name, label, type = "text", autoComplete) {
    return <label>{label}<input type={type} required maxLength={name.includes("password") ? 128 : 255}
      minLength={name.includes("password") && mode !== "login" ? 10 : undefined}
      autoComplete={autoComplete} value={form[name]} onChange={e => setForm({...form, [name]: e.target.value})}/></label>;
  }
  return <div id="main-content" className="auth-shell"><div className="auth-intro"><div className="brand"><span>▧</span> invoice desk</div>
    <h1>A little more clarity.<br/>Every invoice, every day.</h1><p>Track payments, stay on top of due dates, and keep your client follow-ups in one place.</p>
    <div className="auth-note">A private workspace for your invoices.</div></div>
    <div className="auth-card panel"><div className="eyebrow">YOUR WORKSPACE</div><h2>{titles[mode]}</h2>
      <p>{mode === "register" ? "Create an account to get started." : "Manage your invoices with confidence."}</p>
      {error && <div className="alert" role="alert">{error}</div>}{notice && <div className="notice" role="status">{notice}</div>}
      <form onSubmit={submit}>
        {mode === "register" && field("full_name", "Your name", "text", "name")}
        {mode !== "reset" && field("email", "Email address", "email", "email")}
        {["login", "register"].includes(mode) && field("password", "Password", "password", mode === "login" ? "current-password" : "new-password")}
        {mode === "reset" && field("new_password", "New password", "password", "new-password")}
        {["register", "reset"].includes(mode) && <p className="password-hint">Use at least 10 characters and avoid common passwords.</p>}
        <button className="button submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in →" : mode === "register" ? "Create account →" : mode === "forgot" ? "Send reset link" : "Save password"}</button>
      </form>
      <div className="auth-links">{mode === "login" ? <><button onClick={() => {setMode("register"); setError(""); setNotice("")}}>Create an account</button><button onClick={() => {setMode("forgot"); setError(""); setNotice("")}}>Forgot password?</button></>
        : <button onClick={() => {setMode("login"); setError(""); setNotice("")}}>Back to sign in</button>}</div>
    </div></div>;
}
