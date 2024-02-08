import CryptoJS from "crypto-js";

const secretKey = process.env.REACT_APP_SECRET_KEY;

const encryptData = (data) => {
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(JSON.stringify(data)), secretKey).toString();
  return encrypted;
};

const decryptData = (text) => {
  const bytes = CryptoJS.AES.decrypt(text, secretKey);
  const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  return decrypted;
};

export { encryptData, decryptData };
