import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './api/client';
import { Container, Row, Col, Card, Button, Table, Badge, Nav } from 'react-bootstrap';
import Difficulty from './Difficulty';

const rankLabel = (rating) => {
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2100) return 'Master';
  if (rating >= 1900) return 'Candidate Master';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Specialist';
  if (rating >= 1200) return 'Pupil';
  return 'Newbie';
};

const rankVariant = (rating) => {
  if (rating >= 2400) return 'danger';
  if (rating >= 2100) return 'warning';
  if (rating >= 1900) return 'info';
  if (rating >= 1600) return 'primary';
  if (rating >= 1400) return 'success';
  return 'secondary';
};

const getRatingColor = (rating) => {
  if (rating >= 2400) return '#ff5e5e';
  if (rating >= 2100) return '#ff9f1c';
  if (rating >= 1900) return '#4f9dff';
  if (rating >= 1600) return '#5a5fff';
  if (rating >= 1400) return '#28a745';
  if (rating >= 1200) return '#6f42c1';
  return '#6c757d';
};

const getRatingFill = (user) => {
  if (user.ratingFill) return user.ratingFill;
  if (!user.rating) return 0;
  return Math.min(100, Math.max(20, Math.round(user.rating / 30)));
};

const getBannerBackground = (rating) => {
  const color = getRatingColor(rating);
  return rating ? `linear-gradient(135deg, ${color}, rgba(0,0,0,0.25))` : 'linear-gradient(135deg, rgba(102, 16, 242, 0.95), rgba(147, 51, 234, 0.9))';
};

const getUniqueContests = (submissions) => {
  if (!submissions || submissions.length === 0) return [];
  const contestMap = new Map();
  submissions.forEach((submission) => {
    if (submission.problemset?.contest) {
      const contestId = submission.problemset.contest.id;
      if (!contestMap.has(contestId)) {
        contestMap.set(contestId, submission.problemset.contest);
      }
    }
  });
  return Array.from(contestMap.values());
};

export default function Profile(){
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mojUser'));
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(()=>{
    const stored = localStorage.getItem('mojUser');
    const cached = stored ? JSON.parse(stored) : null;
    if (cached) setUser(cached);

    apiClient.getCurrentUser()
      .then((currentUser) => {
        localStorage.setItem('mojUser', JSON.stringify(currentUser));
        setUser(currentUser);
        return currentUser;
      })
      .then((currentUser) => {
        if (!currentUser) throw new Error('User not found');
        return apiClient.getUser(currentUser.id);
      })
      .then((profileData) => {
        setProfile(profileData);
        setError(null);
      })
      .catch((err) => {
        if (!cached) {
          navigate('/login');
          return;
        }
        setError(err.message || 'Unable to load profile');
      })
      .finally(() => setLoading(false));
  },[navigate]);

  if (loading) return <Container className="p-4">Loading profile...</Container>;
  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;
  const displayUser = {
    ...profile,
    ...user
  };
  const rating = displayUser?.rating ?? 0;
  const joined = displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Unknown';
  const uniqueContests = getUniqueContests(profile?.submissions);
  const ratingColor = displayUser?.ratingColor || getRatingColor(rating);
  const ratingFill = getRatingFill(displayUser);

  return (
    <Container className="p-4">
      <Row>
        <Col md={12} className="mb-4">
          <Card className="profile-banner p-4" style={{ background: getBannerBackground(rating) }}>
            <Row className="align-items-center">
              <Col md={9}>
                <div className="d-flex align-items-center gap-3">
                  <img src={displayUser?.profilePic || 'https://via.placeholder.com/140'} alt="avatar" className="profile-avatar" />
                  <div>
                    <h2 className="mb-1">{displayUser?.username || `User ${displayUser?.id}`}</h2>
                    <div className="d-flex align-items-center gap-2">
                      <Badge pill bg={rankVariant(rating)}>{rankLabel(rating)}</Badge>
                      <span className="text-muted">Member since {joined}</span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="h-100">
            <Card.Body>
              <div className="mb-3">
                <strong>Rating:</strong>
                {rating ? (
                    <Difficulty 
                      rating={rating} 
                      fill={ratingFill}
                      color={ratingColor}
                    />
                ) : (
                  <span className="text-muted ms-2">Unrated</span>
                )}
              </div>
              <hr />
              <div className="mb-2"><strong>Role:</strong> {displayUser?.role}</div>
              <div className="mb-2"><strong>Solved:</strong> {displayUser?.solvedProblems ?? 0}</div>
              <div className="mb-2"><strong>Contests:</strong> {uniqueContests.length}</div>
              {displayUser?._count?.submissions !== undefined && (
                <div><strong>Submissions:</strong> {displayUser._count.submissions}</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="h-100">
            <Card.Body>
              <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="recent">Recent Activity</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="submissions">Submissions</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="contests">Contests</Nav.Link>
                </Nav.Item>
              </Nav>

              {activeTab === 'recent' && (
                <>
                  {profile?.submissions?.length > 0 ? (
                    <Table hover responsive size="sm" className="mt-3 mb-0">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Problem</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.submissions.slice(0, 8).map((submission) => (
                          <tr key={submission.id}>
                            <td>{new Date(submission.createdAt).toLocaleString()}</td>
                            <td>{submission.problemset?.title || 'Unknown'}</td>
                            <td>
                              <Badge bg={submission.status === 'ACCEPTED' ? 'success' : submission.status === 'FAILED' ? 'danger' : 'secondary'}>
                                {submission.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">No recent submissions yet.</p>
                  )}
                </>
              )}

              {activeTab === 'submissions' && (
                <>
                  {profile?.submissions?.length > 0 ? (
                    <Table hover responsive size="sm" className="mt-3 mb-0">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Problem</th>
                          <th>Status</th>
                          <th>Passed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.submissions.map((submission) => (
                          <tr key={submission.id}>
                            <td>{new Date(submission.createdAt).toLocaleString()}</td>
                            <td>{submission.problemset?.title || 'Unknown'}</td>
                            <td>
                              <Badge bg={submission.status === 'ACCEPTED' ? 'success' : submission.status === 'FAILED' ? 'danger' : 'secondary'}>
                                {submission.status}
                              </Badge>
                            </td>
                            <td>{submission.testsPassed ?? 0}/{submission.totalTests ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">No submissions yet.</p>
                  )}
                </>
              )}

              {activeTab === 'contests' && (
                <>
                  {uniqueContests.length > 0 ? (
                    <Table hover responsive size="sm" className="mt-3 mb-0">
                      <thead>
                        <tr>
                          <th>Contest</th>
                          <th>Status</th>
                          <th>Start Time</th>
                          <th>End Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueContests.map((contest) => (
                          <tr key={contest.id}>
                            <td>{contest.title}</td>
                            <td>
                              <Badge bg={contest.status === 'FINISHED' ? 'secondary' : contest.status === 'ONGOING' ? 'warning' : 'info'}>
                                {contest.status}
                              </Badge>
                            </td>
                            <td>{new Date(contest.startTime).toLocaleString()}</td>
                            <td>{new Date(contest.endTime).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted">No contests participated yet.</p>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
