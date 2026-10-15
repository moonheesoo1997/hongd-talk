import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase-config.js';

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const screens = [...document.querySelectorAll('[data-screen]')];
const loginForm = document.querySelector('#login-form');
const signupForm = document.querySelector('#signup-form');
const loginStatus = document.querySelector('#login-status');
const signupStatus = document.querySelector('#signup-status');
const conversationTitle = document.querySelector('#conversation-title');
const messages = document.querySelector('#messages');
const logoutButton = document.querySelector('#logout-button');

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle('is-active', screen.dataset.screen === name);
  });

  document.querySelectorAll('[data-go]').forEach((button) => {
    const isCurrent =
      button.dataset.go === name ||
      (name === 'conversation' && button.dataset.go === 'chats');

    button.classList.toggle('is-current', isCurrent);
    if (isCurrent) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  window.scrollTo(0, 0);
  document.querySelector(`[data-screen="${name}"]`)?.querySelector('input, button')?.focus({ preventScroll: true });
}

function setStatus(target, message, isError = true) {
  target.textContent = message;
  target.style.color = isError ? '#b42318' : '#157347';
}

function requireSupabase(statusTarget) {
  if (supabase) return true;
  setStatus(statusTarget, 'Supabase 연결 정보가 아직 설정되지 않았습니다.');
  return false;
}

function setPending(form, pending) {
  [...form.elements].forEach((element) => {
    element.disabled = pending;
  });
}

function openChat(name) {
  conversationTitle.textContent = name;
  showScreen('conversation');
}

async function loadProfile(user) {
  document.querySelector('#profile-email').textContent = user.email ?? '';
  const fallbackName = user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자';
  const { data, error } = await supabase
    .from('profiles')
    .select('nickname, bio')
    .eq('id', user.id)
    .maybeSingle();

  const nickname = error ? fallbackName : data?.nickname || fallbackName;
  const bio = error ? '' : data?.bio || '';
  document.querySelector('#profile-nickname').textContent = nickname;
  document.querySelector('#profile-initial').textContent = nickname.slice(0, 1);
  document.querySelector('#profile-bio').textContent = bio || '자기 소개를 등록해 주세요.';
}

async function restoreSession() {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  await loadProfile(session.user);
  showScreen('home');
}

document.querySelectorAll('[data-go]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.go));
});

document.querySelectorAll('[data-chat]').forEach((button) => {
  button.addEventListener('click', () => openChat(button.dataset.chat));
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireSupabase(loginStatus)) return;

  const email = document.querySelector('#login-email').value.trim();
  const password = document.querySelector('#login-password').value;
  if (!email || !password) {
    setStatus(loginStatus, '이메일과 비밀번호를 입력해 주세요.');
    return;
  }

  setPending(loginForm, true);
  setStatus(loginStatus, '로그인 중입니다.', false);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  setPending(loginForm, false);

  if (error || !data.user) {
    setStatus(loginStatus, error?.message || '로그인에 실패했습니다. 다시 시도해 주세요.');
    return;
  }

  loginForm.reset();
  setStatus(loginStatus, '', false);
  await loadProfile(data.user);
  showScreen('home');
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireSupabase(signupStatus)) return;

  const data = new FormData(signupForm);
  const nickname = String(data.get('nickname') || '').trim();
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  const passwordConfirm = String(data.get('passwordConfirm') || '');
  const bio = String(data.get('bio') || '').trim();

  if (!nickname || !email || !password) {
    setStatus(signupStatus, '닉네임, 이메일, 비밀번호를 입력해 주세요.');
    return;
  }
  if (password !== passwordConfirm) {
    setStatus(signupStatus, '비밀번호 확인이 일치하지 않습니다.');
    return;
  }

  setPending(signupForm, true);
  setStatus(signupStatus, '계정을 만드는 중입니다.', false);
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname, bio },
      emailRedirectTo: window.location.origin,
    },
  });
  setPending(signupForm, false);

  if (error) {
    setStatus(signupStatus, error.message);
    return;
  }

  signupForm.reset();
  if (!authData.session) {
    setStatus(signupStatus, '확인 이메일을 보냈습니다. 이메일 확인 후 로그인해 주세요.', false);
    return;
  }

  setStatus(signupStatus, '', false);
  await loadProfile(authData.user);
  showScreen('home');
});

logoutButton.addEventListener('click', async () => {
  if (supabase) await supabase.auth.signOut();
  loginForm.reset();
  showScreen('login');
});

document.querySelector('#composer').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#message-input');
  const text = input.value.trim();
  if (!text) return;
  const bubble = document.createElement('p');
  bubble.className = 'bubble outgoing';
  bubble.textContent = text;
  messages.append(bubble);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
});

restoreSession();
