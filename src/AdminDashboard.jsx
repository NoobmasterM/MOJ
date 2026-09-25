import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Form, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './api/client';
import AuthorDashboard from './AuthorDashboard';
import Difficulty from './Difficulty';
import { getRatingColor, getRatingFill } from './colorUtils';

const userRatingFill = (user) => getRatingFill(user.rating, user.ratingFill);
const userRatingColor = (user) => user.ratingColor || getRatingColor(user.rating);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]), [contests, setContests] = useState([]), [allProblems, setAllProblems] = useState([]), [error, setError] = useState(''), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [contest, setContest] = useState({ title: '', description: '', startTime: '', endTime: '', problemIds: [] }), [editingContest, setEditingContest] = useState(null), [searchUser, setSearchUser] = useState(''), [contestProblemSearch, setContestProblemSearch] = useState(''), [notification, setNotification] = useState(''), [sendingNotification, setSendingNotification] = useState(false);

  const getContestStatus = (item) => {
    const now = Date.now();
    const startTime = new Date(item.startTime).getTime();
    const endTime = new Date(item.endTime).getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) return item.status || 'UPCOMING';
    if (now < startTime) return 'UPCOMING';
    if (now <= endTime) return 'ONGOING';
    return 'FINISHED';
  };

  const load = async () => {
    try {
      setLoading(true);
      const [usersData, contestsData, problemsData] = await Promise.all([apiClient.getUsers(), apiClient.getContests(), apiClient.getProblems(true)]);
      setUsers(usersData);
      setContests(contestsData);
      setAllProblems(problemsData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    const user = users.find((item) => item.id === id);
    if (user && user.username === 'NoobmasterM') {
      setError('403 - NoobmasterM role cannot be changed.');
      return;
    }

    try {
      const updatedUser = await apiClient.updateUser(id, { role });
      setUsers((current) => current.map((item) => item.id === id ? updatedUser : item));
      setError('');
      setMessage(`${updatedUser.username} is now ${updatedUser.role}.`);
    } catch (err) {
      setMessage('');
      setError(err.message);
    }
  };

  const updateUserRating = (id, field, value) => {
    setUsers((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const createContest = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...contest, problemIds: contest.problemIds || [] };
      if (editingContest) await apiClient.updateContest(editingContest, payload); else await apiClient.createContest(payload);
      setContest({ title: '', description: '', startTime: '', endTime: '', problemIds: [] });
      setContestProblemSearch('');
      setEditingContest(null);
      setError('');
      setMessage(editingContest ? 'Contest updated.' : 'Contest created.');
      load();
    } catch (err) {
      setMessage('');
      setError(err.message);
    }
  };

  const localDateTime = (value) => value ? new Date(value).toISOString().slice(0, 16) : '';
  const editContest = async (item) => {
    try {
      const detail = await apiClient.getContest(item.id);
      setEditingContest(item.id);
      setContest({
        title: item.title,
        description: item.description || '',
        startTime: localDateTime(item.startTime),
        endTime: localDateTime(item.endTime),
        problemIds: Array.isArray(detail.problemsets) ? detail.problemsets.map((problem) => Number(problem.id)).filter(Boolean) : []
      });
      setContestProblemSearch('');
    } catch (err) {
      setError(err.message);
    }
  };
  const removeContest = async (id) => {
    try {
      await apiClient.deleteContest(id);
      setContests((current) => current.filter((item) => item.id !== id));
      setError('');
      setMessage('Contest deleted.');
    } catch (err) { setMessage(''); setError(err.message); }
  };

  const applyContestRatings = async (contestId) => {
    try {
      await apiClient.applyContestRatings(contestId);
      setError('');
      setMessage('Contest ratings applied to all users.');
      await load();
    } catch (err) {
      setMessage('');
      setError(err.message);
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    try {
      setSendingNotification(true);
      await apiClient.createNotification(notification);
      setNotification('');
      setError('');
      setMessage('Notification sent to all users.');
    } catch (err) { setMessage(''); setError(err.message); }
    finally { setSendingNotification(false); }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchUser.trim()) return false;
    return user.username.toLowerCase().includes(searchUser.trim().toLowerCase());
  });

  const filteredContestProblems = allProblems.filter((problem) => {
    const query = contestProblemSearch.trim().toLowerCase();
    if (!query) return true;
    return (problem.title || '').toLowerCase().includes(query)
      || (problem.authorUsername || '').toLowerCase().includes(query)
      || String(problem.id).includes(query);
  });

  const resetContestForm = () => {
    setContest({ title: '', description: '', startTime: '', endTime: '', problemIds: [] });
    setContestProblemSearch('');
    setEditingContest(null);
  };

  return (
    <Container className="p-4">
      <h2>Console</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}

      <h4 className="mt-4">Send notification</h4>
      <Form onSubmit={sendNotification} className="mb-4">
        <Form.Control as="textarea" rows={3} maxLength={1000} placeholder="This notification will be sent to all users" value={notification} onChange={(e) => setNotification(e.target.value)} required />
        <Button className="mt-2" type="submit" variant="success" disabled={sendingNotification}>{sendingNotification ? 'Sending...' : 'Send'}</Button>
      </Form>

      <h4 className="mt-4">{editingContest ? 'Edit contest' : 'Create contest'}</h4>
      <Form onSubmit={createContest} className="mb-4">
        <Form.Control className="mb-2" placeholder="Title" value={contest.title} onChange={(e) => setContest({ ...contest, title: e.target.value })} required />
        <Form.Control className="mb-2" placeholder="Description" value={contest.description} onChange={(e) => setContest({ ...contest, description: e.target.value })} />
        <Form.Control className="mb-2" type="datetime-local" value={contest.startTime} onChange={(e) => setContest({ ...contest, startTime: e.target.value })} required />
        <Form.Control className="mb-2" type="datetime-local" value={contest.endTime} onChange={(e) => setContest({ ...contest, endTime: e.target.value })} required />
        <Form.Group className="mb-3">
          <Form.Label><h6>Problems:</h6></Form.Label>
          <Form.Control
            className="mb-2"
            type="text"
            placeholder="Search problems to add"
            value={contestProblemSearch}
            onChange={(e) => setContestProblemSearch(e.target.value)}
          />
          <div className="border rounded p-2 bg-light" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filteredContestProblems.length === 0 ? (
              <div className="text-muted small">No matching problems available</div>
            ) : (
              filteredContestProblems.map((problem) => {
                const checked = (contest.problemIds || []).includes(Number(problem.id));
                return (
                  <Form.Check
                    key={problem.id}
                    type="checkbox"
                    id={`contest-problem-${problem.id}`}
                    label={`${problem.title}${problem.archived ? ' (Archived)' : ''}`}
                    checked={checked}
                    onChange={(e) => {
                      const nextProblemIds = e.target.checked
                        ? [...(contest.problemIds || []), Number(problem.id)]
                        : (contest.problemIds || []).filter((id) => id !== Number(problem.id));
                      setContest({ ...contest, problemIds: nextProblemIds });
                    }}
                    className="mb-2"
                  />
                );
              })
            )}
          </div>
          <Form.Text className="text-muted">Selected: {(contest.problemIds || []).length}. Search by title, author, or problem ID, then tick the problems you want to add.</Form.Text>
        </Form.Group>
        <Button type="submit" variant="success">{editingContest ? 'Save contest' : 'Create contest'}</Button>
        {editingContest && <Button type="button" variant="danger" className="ms-2" onClick={resetContestForm}>Cancel</Button>}
      </Form>

      <h4>All contests</h4>
      <Table striped responsive className="mb-5">
        <thead><tr><th>Title</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {contests.length === 0 ? <tr><td colSpan="5">No contests yet.</td></tr> : contests.map((item) => {
            const contestStatus = getContestStatus(item);
            const isFinished = contestStatus === 'FINISHED';
            const ratingAlreadyApplied = Boolean(item.ratingUpdatedAt) && new Date(item.ratingUpdatedAt).getTime() >= new Date(item.endTime).getTime();
            return (
              <tr
                key={item.id}
                className="align-middle"
                onClick={(event) => {
                  const clickedButton = event.target.closest('button');
                  if (!clickedButton) navigate(`/contests/${item.id}`);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td>{item.title}</td>
                <td>{new Date(item.startTime).toLocaleString()}</td>
                <td>{new Date(item.endTime).toLocaleString()}</td>
                <td>
                  <Badge bg={contestStatus === 'ONGOING' ? 'success' : contestStatus === 'UPCOMING' ? 'info' : 'secondary'}>{contestStatus}</Badge>
                </td>
                <td>
                  <div className="d-flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                    <Button size="sm" variant="outline-primary" onClick={() => editContest(item)}>Edit</Button>
                    {isFinished && (
                      <Button
                        size="sm"
                        variant={ratingAlreadyApplied ? 'secondary' : 'outline-success'}
                        onClick={() => !ratingAlreadyApplied && applyContestRatings(item.id)}
                        disabled={ratingAlreadyApplied}
                      >
                        {ratingAlreadyApplied ? 'Ratings applied' : 'Apply ratings'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline-danger" onClick={() => removeContest(item.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <h4>Users</h4>
      <Form.Control
        className="mb-3"
        type="text"
        placeholder="Search by username"
        value={searchUser}
        onChange={(e) => setSearchUser(e.target.value)}
      />

      {searchUser.trim() && (
        loading ? (
          <p>Loading users…</p>
        ) : filteredUsers.length === 0 ? (
          <Alert variant="info">No matching username found.</Alert>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div>
                  <strong>{user.username}</strong>
                  <Difficulty rating={user.rating || 0} fill={userRatingFill(user)} color={userRatingColor(user)} />
                  <div className="text-muted small">ID: {user.id} · {user.email}</div>
                </div>
                <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
                  <Form.Select size="sm" value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} disabled={user.username === 'NoobmasterM'} style={{ minWidth: 130 }}>
                    <option value="USER">User</option>
                    <option value="AUTHOR">Author</option>
                    <option value="ADMIN">Admin</option>
                  </Form.Select>
                  {user.username === 'NoobmasterM' && <small className="text-muted">Protected</small>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <hr className="my-5" />
      <AuthorDashboard embedded adminMode />
    </Container>
  );
}
