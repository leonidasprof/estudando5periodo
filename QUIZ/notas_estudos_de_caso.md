# Notas dos estudos de caso (base para questões futuras do quiz)

> O estudo de caso da Unidade 1 ("unidade 1 - estudo de caso01.pdf") ainda não está na pasta.
> As notas abaixo vêm de trabalhos que parecem ser de unidades posteriores (o SecurePay cita "Unidade 3").

## FinTech SecurePay (ATIVIDADES/Incidente na FinTech SecurePay.pdf)
- **5 fases do ataque:** Reconhecimento → Escaneamento → Obtenção de acesso → Manutenção do acesso → Ações sobre o objetivo.
  - Reconhecimento: redes sociais, LinkedIn, GitHub público (coleta passiva / OSINT).
  - Escaneamento: varredura de IPs, portas abertas, Apache desatualizado, API exposta.
  - Obtenção de acesso: exploração de CVE, credenciais em arquivos de configuração, engenharia social.
  - Manutenção: escalada de privilégios (sudo mal configurado).
  - Ações sobre o objetivo: dados de clientes comprometidos + 48h fora do ar.
- **Fase mais fácil de detectar:** escaneamento (gera ruído em logs, IDS/IPS, SIEM).
- **Engenharia social no help desk:** princípio da **autoridade** (atacante fingiu ser desenvolvedor sênior) + urgência.
  - Defesas: validar identidade, callback para telefone cadastrado, MFA, aprovação do gestor, treinamento.
- **Ferramentas de pentest:** Nmap (portas), Nessus/OpenVAS (vulnerabilidades), Burp Suite (aplicações web/API), Metasploit (exploração).
- **Ethical Hacking:** achar vulnerabilidades antes dos criminosos.
- **Credenciais:** cofre de segredos + AES-256; senhas com hash lento (Argon2, bcrypt, PBKDF2).
- **Resposta a incidentes:** CSIRT; contenção → erradicação → recuperação.
- **Backup:** frequente, protegido contra ransomware, com teste de restauração.

## HealthMed Brasil – Ransomware (ATIVIDADES/Trabalho_Leonidas_HealthMed.docx.pdf)
- **Criptografia híbrida:** AES-256 (simétrica, rápida, cifra os dados) + RSA-4096 (assimétrica, cifra a chave AES).
- **TDE (criptografia em repouso):** é **mitigação**, não prevenção. Protege contra roubo de mídia/backup físico, mas não contra atacante com privilégio no sistema em execução.
- **Gestão de chaves:** nunca guardar a chave junto com os dados → usar HSM/KMS + IAM.
- **Vetor de entrada:** phishing + VPN sem MFA + protocolo PPTP obsoleto.
  - Correção: certificado digital (mTLS) + MFA (TOTP/push) + VPN moderna (OpenVPN, WireGuard, IPsec/IKEv2).
- **Hash (SHA-256):** detecta **alteração** (integridade), mas **não** detecta cópia/exfiltração (ler não muda o hash) → complementar com DLP.
- **Efeito avalanche:** mudar 1 byte muda o hash inteiro.
- **Pós-quântica:** RSA/ECC vulneráveis ao algoritmo de Shor; NIST: ML-KEM, ML-DSA; ameaça "Harvest Now, Decrypt Later".
- **IA/UEBA, SIEM/SOAR/XDR:** detectar comportamento anômalo (movimentação lateral, exfiltração).
- **Zero Trust:** "nunca confie, sempre verifique".
