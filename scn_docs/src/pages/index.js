import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
    {
        description: 'Built with Redux + React. Making client-side fast and responsive. You can open datasets with hundreds of thousands of cell and check gene expression in seconds.',
        imageUrl: `img/undraw_react.svg`,
        imageAlign: 'top',
        title: 'It is very fast',
    },
    {
        description: 'Check out pathway expression, find cell types by gene signatures and more.',
        imageUrl: `img/undraw_code_review.svg`,
        imageAlign: 'top',
        title: 'Advanced analysis',
    },
    {
        description: 'We processed thousands of scRNA-seq datasets and made it freely available for everyone. Now you can open several datasets of interest and explore them at once.',
        imageUrl: `img/undraw_operating_system.svg`,
        imageAlign: 'top',
        title: 'Public datasets',
    },
    {
        description: 'We are open source. You can even run the whole explorer locally using just `docker-compose`. ',
        imageUrl: `img/undraw_open_source.svg`,
        imageAlign: 'top',
        title: 'Open source',
    }
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={`Documentation for ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/')}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
