import { login, getSession } from "../lib/auth";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const result = await login(email, password);
    console.log("LOGIN:", result);

    const session = await getSession();
    console.log("SESSION:", session);
  };
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md">
        <h1 className="text-center text-2xl font-bold mb-4">Login</h1>
        <div className="flex flex-col gap-4">
          <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>

  );
}
