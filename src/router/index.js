import Vue from 'vue';
import Router from 'vue-router';

import store from '@/store';
import SearchPage from '@/components/SearchPage';
import ResultsPage from '@/components/ResultsPage';
import TermsOfUsePage from '@/components/TermsOfUsePage';
import BodySystemForm from '@/components/BodySystemForm';
import FeedbackPage from '@/components/FeedbackPage';

Vue.use(Router);

const termsOfUsePath = '/terms-of-use';
const searchPath = '/search';
const bodySystemPath = '/body-systems';

/**
 * Redirect to the terms of use if they have not already been accepted.
 */
export const checkTermsAccepted = (to, from, next) => {
  const { meta = {} } = to;
  if (meta.requireTermsOfUse && !store.state.termsOfUseAccepted) {
    next({
      path: termsOfUsePath
    });
  } else {
    next();
  }
};

/**
 * Redirect to the search page if terms have already been accepted.
 */
export const skipWhenAlreadyAccepted = (to, from, next) => {
  if (store.state.termsOfUseAccepted) {
    next({
      path: bodySystemPath
    });
  } else {
    next();
  }
};

/**
 * Adds a meta block to the provided route definition so that terms of use must be
 * accepted before the route can be entered.
 * @param {Object} routeDefinition - the route definition to decorate
 * @return {Object} the route definition, with a `meta` block that requires accepting
 *   terms of use
 */
function protectedRoute(routeDefinition) {
  const termsMeta = { meta: { requireTermsOfUse: true } };
  return Object.assign({}, routeDefinition, termsMeta);
}

export const routes = [
  protectedRoute({
    path: '/',
    redirect: termsOfUsePath
  }),
  protectedRoute({
    path: bodySystemPath,
    component: BodySystemForm
  }),
  protectedRoute({
    path: searchPath,
    component: SearchPage
  }),
  protectedRoute({
    path: '/feedback',
    component: FeedbackPage
  }),
  protectedRoute({
    path: '/results',
    component: ResultsPage
  }),
  {
    path: termsOfUsePath,
    component: TermsOfUsePage,
    beforeEnter: skipWhenAlreadyAccepted
  },
  {
    path: '*',
    redirect: '/'
  }
];

const router = new Router({
  routes
});

router.beforeResolve(checkTermsAccepted);

export default router;
