use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use rand::RngCore;

pub fn generate_key() -> String {
    let key = Aes256Gcm::generate_key(&mut OsRng);
    B64.encode(key)
}

pub fn encrypt(plaintext: &[u8], key_b64: &str) -> Result<String, String> {
    let key_bytes = B64.decode(key_b64).map_err(|e| format!("Invalid key: {}", e))?;
    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, plaintext).map_err(|e| e.to_string())?;

    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(B64.encode(&combined))
}

pub fn decrypt(encrypted_b64: &str, key_b64: &str) -> Result<Vec<u8>, String> {
    let key_bytes = B64.decode(key_b64).map_err(|e| format!("Invalid key: {}", e))?;
    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;

    let combined = B64.decode(encrypted_b64).map_err(|e| format!("Invalid data: {}", e))?;
    if combined.len() < 12 {
        return Err("Data too short".to_string());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    cipher.decrypt(nonce, ciphertext).map_err(|e| e.to_string())
}
