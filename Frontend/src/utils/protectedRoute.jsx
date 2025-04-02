/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import {Navigate } from 'react-router-dom';
import { auth } from './firebase.js';

const ProtectedRoute = ({ element: Component, ...rest }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return user ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;
