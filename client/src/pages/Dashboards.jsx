import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function IndividualDashboard() {
  const { user } = useAuth();
  return (
    <main className="page-wrap dashboard-wrap">
      <p className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING SPACE</p>
      <h1>One step at a time, {user.profile.fullName.split(' ')[0]}.</h1>
      <p className="dashboard-intro">Your HandSpeak account is ready. Choose a lesson and keep building your ASL practice.</p>
      <Link className="button" to="/learn">Explore your lessons <span aria-hidden="true">→</span></Link>
    </main>
  );
}

export function OrganizationDashboard() {
  const { user } = useAuth();
  return (
    <main className="page-wrap dashboard-wrap">
      <p className="eyebrow"><span className="eyebrow-line" /> ORGANIZATION SPACE</p>
      <h1>Good to have you here, {user.profile.organizationName}.</h1>
      <p className="dashboard-intro">Your organization account is ready. More team tools and community resources are on the way.</p>
      <Link className="button" to="/community">Visit the community <span aria-hidden="true">→</span></Link>
    </main>
  );
}
