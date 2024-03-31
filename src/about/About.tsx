import packageJson from '../../package.json';

export const About = () => {
  const version = packageJson.version;
  return (
    <div>
      <h1>About</h1>
      <p>Version: {version}</p>
    </div>
  );
};
