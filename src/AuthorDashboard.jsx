import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';

const blank = { title: '', description: '', difficulty: 'EASY', input: '', output: '', notes: '', editorial: '', examplesText: '[]', testCasesText: '[]', timeLimit: 1, memoryLimit: 256, tags: [] };
const jsonArray = (value, label) => { let parsed; try { parsed = JSON.parse(value); } catch { throw new Error(`${label} must be valid JSON`); } if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array`); return parsed; };

export default function AuthorDashboard({ embedded = false }) {
  const [user, setUser] = useState(null), [problems, setProblems] = useState([]), [form, setForm] = useState(blank), [editing, setEditing] = useState(null), [error, setError] = useState('');

  const load = async () => {
    try {
      const current = await apiClient.getCurrentUser();
      setUser(current);
      const all = await apiClient.getProblems();
      setProblems(all.filter((problem) => problem.createdBy === current.id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { examplesText, testCasesText, ...fields } = form;
      const payload = { ...fields, examples: jsonArray(examplesText, 'Examples'), testCases: jsonArray(testCasesText, 'Test cases') };
      if (editing) await apiClient.updateProblem(editing, payload); else await apiClient.createProblem(payload);
      setForm(blank);
      setEditing(null);
      setError('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = async (problem) => {
    try {
      const detail = await apiClient.getProblem(problem.id);
      setEditing(problem.id);
      setForm({ ...blank, ...detail, examplesText: JSON.stringify(detail.examples || [], null, 2), testCasesText: JSON.stringify(detail.testCases || [], null, 2) });
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (problemId) => {
    try {
      await apiClient.deleteProblem(problemId);
      setError('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user && !['AUTHOR', 'ADMIN'].includes(user.role)) {
    return <Container className="p-4"><Alert variant="danger">403 - Author access is required.</Alert></Container>;
  }

  const content = (
    <>
      <h3>{embedded ? 'Problem management' : 'Console'}</h3>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={submit} className="mb-4">
        <Form.Control className="mb-2" placeholder="Problem title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Form.Select className="mb-2" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
          <option>EASY</option>
          <option>MEDIUM</option>
          <option>HARD</option>
        </Form.Select>
        <Form.Control as="textarea" className="mb-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <Form.Control as="textarea" className="mb-2" placeholder="Input format" value={form.input} onChange={(e) => setForm({ ...form, input: e.target.value })} />
        <Form.Control as="textarea" className="mb-2" placeholder="Output format" value={form.output} onChange={(e) => setForm({ ...form, output: e.target.value })} />
        <Form.Control as="textarea" className="mb-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Form.Control type="text" inputMode="numeric" pattern="[0-9]*" className="mb-2" placeholder="Time limit (ms)" value={form.timeLimit === 0 ? '' : form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value === '' ? 0 : Number(e.target.value) })} />
        <Form.Control type="text" inputMode="numeric" pattern="[0-9]*" className="mb-2" placeholder="Memory limit (MB)" value={form.memoryLimit === 0 ? '' : form.memoryLimit} onChange={(e) => setForm({ ...form, memoryLimit: e.target.value === '' ? 0 : Number(e.target.value) })} />
        <Form.Control as="textarea" className="mb-2" placeholder={'Examples JSON, e.g. [{"input":"1 2","output":"3"}]'} value={form.examplesText} onChange={(e) => setForm({ ...form, examplesText: e.target.value })} />
        <Form.Control as="textarea" className="mb-2" placeholder={'Test cases JSON, e.g. [{"input":"1 2","output":"3"}]'} value={form.testCasesText} onChange={(e) => setForm({ ...form, testCasesText: e.target.value })} />
        <Form.Control as="textarea" className="mb-2" placeholder="Editorial" value={form.editorial} onChange={(e) => setForm({ ...form, editorial: e.target.value })} />
        <Button type="submit">{editing ? 'Save problem' : 'Create problem'}</Button>
        {editing && <Button variant="secondary" className="ms-2" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}
      </Form>

      <h4>My problems</h4>
      <Table striped responsive>
        <thead>
          <tr>
            <th>Title</th>
            <th>Difficulty</th>
            <th>Time</th>
            <th>Memory</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {problems.length === 0 ? (
            <tr><td colSpan="5">No problems yet.</td></tr>
          ) : problems.map((problem) => (
            <tr key={problem.id}>
              <td><Link to={`/Problems/${problem.id}`}>{problem.title}</Link></td>
              <td>{problem.difficulty}</td>
              <td>{problem.timeLimit || 1} ms</td>
              <td>{problem.memoryLimit || 256} MB</td>
              <td>
                <Button size="sm" variant="outline-primary" onClick={() => edit(problem)}>Edit</Button>
                <Button size="sm" variant="outline-danger" className="ms-2" onClick={() => remove(problem.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  return embedded ? content : <Container className="p-4">{content}</Container>;
}
