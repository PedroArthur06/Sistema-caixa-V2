import { useState } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import './styles.css';

export function Login() {
  // Estados locais para controlar os inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Pegamos a função de login do nosso Contexto Global
  const { signIn } = useAuth();
  
  // Estado de loading local para desabilitar o botão enquanto espera a API
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // Não deixa a página recarregar
    setError(''); // Limpa erros antigos

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setIsLoggingIn(true);
      
      // Chama a função que criamos no AuthContext
      // Se der certo, o AuthContext atualiza o estado 'user' 
      // e o Routes redireciona sozinho para o Dashboard.
      await signIn(email, password);
      
    } catch (err) {
      console.error(err);
      setError('E-mail ou senha incorretos.');
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {/* Aqui entraria a Logo do Restaurante depois */}
          <h1>Sistema Caixa V2</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Entre com suas credenciais</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="ex: admin@bar.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoggingIn}>
            {isLoggingIn ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}