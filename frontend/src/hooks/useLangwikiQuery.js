import { useState } from 'react';
import { askWiki, queryWiki } from '../models/langwiki';

export default function useLangwikiQuery(rootDir) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState('');

  async function search(q) {
    setLoading(true);
    try {
      const data = await queryWiki(q, rootDir);
      setResults(data.results || []);
      setAnswer('');
    } finally {
      setLoading(false);
    }
  }

  async function ask(question) {
    setLoading(true);
    try {
      const data = await askWiki(question, rootDir);
      setResults(data.evidence || []);
      setAnswer(data.answer || '');
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    results,
    answer,
    search,
    ask
  };
}
