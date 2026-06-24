import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listWorkspaces } from '../models/langwiki';
import { getActiveWorkspace, setActiveWorkspace, onWorkspacesChanged } from '../models/workspaceState';

export default function useWorkspaceScope() {
  const { id } = useParams();
  const [workspace, setWorkspace] = useState(() => getActiveWorkspace());

  useEffect(() => {
    if (!id) {
      setWorkspace(getActiveWorkspace());
      return;
    }

    listWorkspaces()
      .then((data) => {
        const found = (data.workspaces || []).find((item) => item.id === id);
        if (found) {
          setActiveWorkspace(found);
          setWorkspace(found);
          return;
        }
        setWorkspace(getActiveWorkspace());
      })
      .catch(() => {
        setWorkspace(getActiveWorkspace());
      });
  }, [id]);

  // 监听工作区变更事件（如 manage 页面保存了新 sourceDir）
  useEffect(() => {
    const unsubscribe = onWorkspacesChanged(() => {
      if (id) {
        listWorkspaces()
          .then((data) => {
            const found = (data.workspaces || []).find((item) => item.id === id);
            if (found) {
              setActiveWorkspace(found);
              setWorkspace(found);
            }
          })
          .catch(() => {});
      } else {
        setWorkspace(getActiveWorkspace());
      }
    });
    return unsubscribe;
  }, [id]);

  return workspace;
}
