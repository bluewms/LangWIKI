const STORAGE_KEY = 'langwiki.activeWorkspace';
const USER_STORAGE_KEY = 'langwiki.userProfile';
const WORKSPACE_CHANGED_EVENT = 'langwiki:workspaces-changed';

export function getActiveWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id && parsed.rootDir ? parsed : null;
  } catch (_error) {
    return null;
  }
}

export function setActiveWorkspace(workspace) {
  if (!workspace?.id || !workspace?.rootDir) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    id: workspace.id,
    name: workspace.name || workspace.id,
    rootDir: workspace.rootDir,
    sourceDir: workspace.sourceDir || '',
    git: workspace.git || null
  }));
}

export function notifyWorkspacesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
}

export function onWorkspacesChanged(listener) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(WORKSPACE_CHANGED_EVENT, listener);
  return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, listener);
}

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return { username: 'default', displayName: 'LangWIKI 用户' };
    const parsed = JSON.parse(raw);
    return {
      username: parsed?.username || 'default',
      displayName: parsed?.displayName || 'LangWIKI 用户'
    };
  } catch (_error) {
    return { username: 'default', displayName: 'LangWIKI 用户' };
  }
}

export function setUserProfile(profile) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
    username: profile?.username || 'default',
    displayName: profile?.displayName || 'LangWIKI 用户'
  }));
}
