import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { apiClient } from './api/client';

const getContestStatus = (contest) => {
  const now = Date.now();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();

  if (now < startTime) return 'UPCOMING';
  if (now <= endTime) return 'ONGOING';
  return 'FINISHED';
};

const formatTimeLeft = (contest) => {
  const status = getContestStatus(contest);
  const targetTime = new Date(status === 'UPCOMING' ? contest.startTime : contest.endTime).getTime();
  const diff = Math.max(0, targetTime - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (status === 'FINISHED') return 'Ended';
  return `${days > 0 ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function ContestDetail() {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getContest(id);
        setContest(data);
      } catch (err) {
        setError(err.message || 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  if (loading) return <Container className="p-4">Loading contest...</Container>;
  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;
  if (!contest) return <Container className="p-4">Contest not found</Container>;

  const status = getContestStatus(contest);
  const problems = Array.isArray(contest.problemsets) ? contest.problemsets : [];

  return (
    <Container className="p-4">
      <Row className="mb-3">
        <Col>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <h2>{contest.title}</h2>
              <p className="text-muted mb-1">{contest.description || 'No description available.'}</p>
              <Badge bg={status === 'ONGOING' ? 'success' : status === 'UPCOMING' ? 'info' : 'secondary'}>
                {status}
              </Badge>
            </div>
           
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <h5>Contest Info</h5>
              <Table borderless size="sm" className="mb-0">
                <tbody>
                  <tr>
                    <th>Start</th>
                    <td>{new Date(contest.startTime).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>End</th>
                    <td>{new Date(contest.endTime).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Duration</th>
                    <td>{formatTimeLeft(contest)}</td>
                  </tr>
                  <tr>
                    <th>Problems</th>
                    <td>{problems.length}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Body>
              <h5>Problem List</h5>
              {problems.length > 0 ? (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem, index) => (
                      <tr key={problem.id}>
                        <td>{index + 1}</td>
                        <td>
                          <Link to={`/Problems/${problem.id}`} className="contest-link">
                            {problem.title}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No problems assigned to this contest yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ContestDetail;
