import React, { useEffect, useState } from 'react';
import { Badge, Button, Container, Table } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from './api/client';
import Difficulty from './Difficulty';
import { getRatingColor, getRatingFill } from './colorUtils';

const getContestStatus = (contest) => {
  const now = Date.now();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();

  if (now < startTime) return 'UPCOMING';
  if (now <= endTime) return 'ONGOING';
  return 'FINISHED';
};

function ContestStandings() {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        const [data, user] = await Promise.all([apiClient.getContest(id), apiClient.getCurrentUser().catch(() => null)]);
        setContest(data);
        setCurrentUser(user);
      } catch (err) {
        setError(err.message || 'Failed to load standings');
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
    const intervalId = setInterval(fetchContest, 15000);
    return () => clearInterval(intervalId);
  }, [id]);

  if (loading) return <Container className="p-4">Loading standings...</Container>;
  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;
  if (!contest) return <Container className="p-4">Contest not found</Container>;

  const status = getContestStatus(contest);
  const standings = Array.isArray(contest.standings) ? contest.standings : [];

  return (
    <Container className="p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2>{contest.title} standings</h2>
          <p className="text-muted mb-1">{contest.description || 'No description available.'}</p>
          <Badge bg={status === 'ONGOING' ? 'success' : status === 'UPCOMING' ? 'info' : 'secondary'}>{status}</Badge>
        </div>
        <Button as={Link} to={`/contests/${id}`} variant="outline-primary">
          Back to contest
        </Button>
      </div>

      {standings.length === 0 ? (
        <div className="border rounded p-4 text-muted">No attempts recorded yet.</div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Rating</th>
              <th>Solved</th>
              <th>Penalty</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry) => {
              const rating = Number(entry.rating ?? 1200);
              const isCurrentUser = Boolean(currentUser && Number(currentUser.id) === Number(entry.userId));
              return (
                <tr key={entry.userId} style={isCurrentUser ? { backgroundColor: '#fff3cd', boxShadow: 'inset 0 0 0 1px #ffda6a' } : undefined}>
                  <td>{entry.rank}</td>
                  <td>
                    <span className="fw-semibold">{entry.username || `User ${entry.userId}`}</span>
                    {isCurrentUser && <Badge bg="warning" text="dark" className="ms-2">You</Badge>}
                  </td>
                  <td><Difficulty rating={rating} fill={getRatingFill(rating)} color={getRatingColor(rating)} /></td>
                  <td>{entry.solved}</td>
                  <td>{entry.penalty}</td>
                  <td>{entry.attempts}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default ContestStandings;
