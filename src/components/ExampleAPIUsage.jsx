import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export function ExampleAPIUsage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProblems();
        setProblems(data);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch problems:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateProblem = async () => {
    try {
      const newProblem = await apiClient.createProblem({
        title: 'New Problem',
        description: 'Problem description',
        difficulty: 'MEDIUM',
        testCases: [],
        constraints: '',
        examples: []
      });
      setProblems([...problems, newProblem]);
    } catch (err) {
      console.error('Failed to create problem:', err);
    }
  };

  const handleCreateSubmission = async (problemId, userId) => {
    try {
      const submission = await apiClient.createSubmission({
        userId,
        problemId,
        code: 'console.log("Hello");',
        language: 'javascript'
      });
      console.log('Submission created:', submission);
    } catch (err) {
      console.error('Failed to create submission:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Problems from PostgreSQL</h2>
      <button onClick={handleCreateProblem}>Create New Problem</button>
      
      <ul>
        {problems.map((problem) => (
          <li key={problem.id}>
            {problem.title} - {problem.difficulty}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExampleAPIUsage;
