import React, { useEffect, useState } from 'react';
import { Alert, Container } from 'react-bootstrap';
import { apiClient } from './api/client';

export default function Ranking(){

    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

   useEffect(() => {
   const fetchRanks = async () => {
          try {
                setLoading(true);
                const data = await apiClient.getRankings();
                setRanks(data);
               } catch (err) {
                   setError(err.message);
                   console.error('Failed to fetch rankings:', err);
               } finally {
                   setLoading(false);
               }
           };
   
           fetchRanks();
       }, []);
   
       if (loading) return <Container className="p-4">Loading rankings...</Container>;
       if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;
   
    return (
      <Container>
        <Table hover responsive>
       <thead>
        <tr>
          <th>No.</th>
          <th>Name</th>
          <th>Rating</th>
        </tr>
      </thead>
      <tbody>
        {ranks.map((rank, idx) => {

          return (
            <tr key={rank.id}>
              <td>{idx + 1}</td>
              <td>{rank.username}</td>  
              <td>{rank.rating}</td>
            </tr>
          );
        })}
      </tbody>
        </Table>
        </Container>
    );
}