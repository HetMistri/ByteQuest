import { register } from "../lib/auth";
import { useState } from "react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    await register(email, password);
    console.log("Registered user:", email);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md">
        <h1 className="text-center text-2xl font-bold mb-4">Register</h1>
        <div className="flex flex-col gap-4">
          <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" 
          className=" focus:border-b-green-600"/>
          <input onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}


