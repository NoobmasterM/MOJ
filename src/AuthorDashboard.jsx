import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';
import Difficulty from './Difficulty';
import { getRatingColor, getRatingFill, getDifficultyBadgeStyle } from './colorUtils';

const blank = { title: '', description: '', difficulty: 'EASY', input: '', output: '', notes: '', editorial: '', examplesText: '[]', testCasesText: '[]', timeLimit: 1, memoryLimit: 256, tags: '', archived: false };
const jsonArray = (value, label) => { let parsed; try { parsed = JSON.parse(value); } catch { throw new Error(`${label} must be valid JSON`); } if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array`); return parsed; };
const parseTags = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);
const ratingFill = (problem) => getRatingFill(problem.editorialRating, problem.editorialFill);
const ratingColor = (problem) => problem.editorialColor || getRatingColor(problem.editorialRating);

export default function AuthorDashboard({ embedded = false, adminMode = false }) {
  const [user, setUser] = useState(null), [problems, setProblems] = useState([]), [form, setForm] = useState(blank), [editing, setEditing] = useState(null), [error, setError] = useState(''), [problemSearch, setProblemSearch] = useState('');

  const load = async () => {
    try {
      const current = await apiClient.getCurrentUser();
      setUser(current);
      const all = await apiClient.getProblems(true);
      setProblems(adminMode ? all : all.filter((problem) => problem.createdBy === current.id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { examplesText, testCasesText, tags, ...fields } = form;
      const payload = {
        ...fields,
        tags: parseTags(tags),
        examples: jsonArray(examplesText, 'Examples'),
        testCases: jsonArray(testCasesText, 'Test cases')
      };
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
      setForm({
        ...blank,
        ...detail,
        tags: Array.isArray(detail.tags) ? detail.tags.join(', ') : '',
        examplesText: JSON.stringify(detail.examples || [], null, 2),
        testCasesText: JSON.stringify(detail.testCases || [], null, 2)
      });
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

  const toggleArchive = async (problem, nextArchived = !Boolean(problem.archived)) => {
    try {
      await apiClient.updateProblem(problem.id, { archived: nextArchived });
      setError('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const query = problemSearch.trim().toLowerCase();
    if (!query) return true;
    return (problem.title || '').toLowerCase().includes(query) || (problem.authorUsername || '').toLowerCase().includes(query);
  });

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
        <Form.Check className="mb-2" type="checkbox" label="Archived" checked={Boolean(form.archived)} onChange={(e) => setForm({ ...form, archived: e.target.checked })} />
        <Form.Control className="mb-2" placeholder="Tags (comma separated, e.g. Math, DP, Graph)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Row className="g-3 mb-2">
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>Examples</Card.Header>
              <Card.Body>
                <Form.Label className="small fw-semibold">Format</Form.Label>
                <pre className="bg-light border rounded p-2 small mb-2">{`[
  {
    "input": "1 2",
    "output": "3",
    "explanation": "Add the two numbers."
  }
]`}</pre>
                <Form.Control as="textarea" rows={8} aria-label="Examples JSON" placeholder={'[{"input":"1 2","output":"3","explanation":"Add the two numbers."}]'} value={form.examplesText} onChange={(e) => setForm({ ...form, examplesText: e.target.value })} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>Test cases</Card.Header>
              <Card.Body>
                <Form.Label className="small fw-semibold">Format</Form.Label>
                <pre className="bg-light border rounded p-2 small mb-2">{`[
  {
    "input": "1 2",
    "output": "3"
  }
]`}</pre>
                <Form.Control as="textarea" rows={8} aria-label="Test cases JSON" placeholder={'[{"input":"1 2","output":"3"}]'} value={form.testCasesText} onChange={(e) => setForm({ ...form, testCasesText: e.target.value })} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Form.Control as="textarea" className="mb-2" placeholder="Editorial" value={form.editorial} onChange={(e) => setForm({ ...form, editorial: e.target.value })} />
        <Button type="submit" variant="success">{editing ? 'Save problem' : 'Create problem'}</Button>
        {editing && <Button variant="danger" className="ms-2" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}
      </Form>

      <h4>{adminMode ? 'All problems' : 'My problems'}</h4>
      <Form.Control
        className="mb-3"
        type="text"
        placeholder="Search problems or authors"
        value={problemSearch}
        onChange={(e) => setProblemSearch(e.target.value)}
      />
      <Table striped responsive>
        <thead>
          <tr>
            <th>Title</th>
            <th>Difficulty</th>
            {adminMode && <th>Author</th>}
            {adminMode && <th>Rating</th>}
            <th>Time</th>
            <th>Memory</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProblems.length === 0 ? (
            <tr><td colSpan={adminMode ? 8 : 6}>No matching problems.</td></tr>
          ) : filteredProblems.map((problem) => (
            <tr key={problem.id}>
              <td><Link to={`/Problems/${problem.id}`}>{problem.title}</Link></td>
              <td><span className="badge" style={getDifficultyBadgeStyle(problem.difficulty)}>{problem.difficulty}</span></td>
              {adminMode && <td>{problem.authorUsername || 'Unknown'}</td>}
              {adminMode && <td>{problem.editorialRating != null ? <Difficulty rating={problem.editorialRating} fill={ratingFill(problem)} color={ratingColor(problem)} /> : '—'}</td>}
              <td>{problem.timeLimit || 1} ms</td>
              <td>{problem.memoryLimit || 256} MB</td>
              <td>
                <Form.Select
                  size="sm"
                  value={problem.archived ? 'archived' : 'active'}
                  onChange={(e) => toggleArchive(problem, e.target.value === 'archived')}
                  style={{ minWidth: 110 }}
                >
                  <option value="active">Archieved</option>
                  <option value="archived">Draft</option>
                </Form.Select>
              </td>
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
