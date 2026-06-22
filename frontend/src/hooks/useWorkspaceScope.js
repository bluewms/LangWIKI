import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listWorkspaces } from '../models/langwiki';
import { getActiveWorkspace, setActiveWorkspace } from '../models/workspaceState';

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

  return workspace;
}
