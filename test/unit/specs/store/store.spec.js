import storeConfig from '@/store';
import bodySystems from '@/store/systems';

import '@/services/data-logging-service';
import scoringService from '@/services/scoring-service';

import exampleTerms from '../../example-terms';

const mockSaveSession = jest.fn();

jest.mock('@/services/scoring-service', () => {
  return {
    score: jest.fn()
  };
});

jest.mock('@/services/data-logging-service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      saveSession: mockSaveSession
    };
  });
});

describe('vuex store', () => {
  test('exports the initial state', () => {
    expect(storeConfig.state).toBeDefined();

    const { state } = storeConfig;
    const uuidPattern = /[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/i;
    expect(state.selectedSystems).toEqual([]);
    expect(state.selectedTerms).toEqual([]);
    expect(state.termsOfUseAccepted).toEqual(false);
    expect(state.qualityScore).toEqual(0);
    expect(state.scoringError).toBeNull();
    expect(state.sessionId).toMatch(uuidPattern);
    expect(state.foundAllConditions).toBeNull();
  });

  test('exports the mutations', () => {
    expect(storeConfig.mutations).toBeDefined();
  });

  test('exports the actions', () => {
    expect(storeConfig.actions).toBeDefined();
  });

  describe('mutations', () => {
    const { mutations } = storeConfig;

    test('addTerm adds the term to the end of the array', () => {
      let term = exampleTerms[1];
      const mockState = {
        selectedTerms: [],
        constrainedTerms: []
      };

      mutations.addTerm(mockState, { term });
      expect(mockState.selectedTerms).toEqual([term]);

      term = exampleTerms[3];
      mutations.addTerm(mockState, { term });
      expect(mockState.selectedTerms.length).toEqual(2);
      expect(mockState.selectedTerms[1]).toEqual(term);
    });

    test('addTerm prevents adding duplicate terms', () => {
      const term = exampleTerms[1];
      const mockState = {
        selectedTerms: [term],
        constrainedTerms: [term]
      };

      mutations.addTerm(mockState, { term });
      expect(mockState.selectedTerms.length).toEqual(1);
    });

    test('addTerm tracks terms added in each mode', () => {
      const [ term1, term2 ] = exampleTerms;
      const mockState = {
        selectedTerms: [],
        constrainedTerms: [],
        unconstrainedTerms: []
      };

      mutations.addTerm(mockState, { term: term1, filterEnabled: false });
      expect(mockState.selectedTerms).toEqual([term1]);
      expect(mockState.constrainedTerms).toEqual([term1]);
      expect(mockState.unconstrainedTerms).toEqual([]);

      mutations.addTerm(mockState, { term: term2, filterEnabled: true });
      expect(mockState.selectedTerms).toEqual([term1, term2]);
      expect(mockState.constrainedTerms).toEqual([term1]);
      expect(mockState.unconstrainedTerms).toEqual([term2]);
    });

    test('removeTermAtIndex removes the term from the array', () => {
      const expectedItem = exampleTerms[2];
      const mockState = {
        selectedTerms: [...exampleTerms],
        constrainedTerms: [...exampleTerms],
        unconstrainedTerms: []
      };

      expect(mockState.selectedTerms).toContain(expectedItem);

      mutations.removeTermAtIndex(mockState, 2);
      expect(mockState.selectedTerms.length).toEqual(exampleTerms.length - 1);
      expect(mockState.selectedTerms).not.toContain(expectedItem);
    });

    test('removeTermAtIndex fixes up mode arrays', () => {
      const removedItem = exampleTerms[2];
      const otherItem = exampleTerms[3];
      const mockState = {
        selectedTerms: [removedItem, otherItem],
        constrainedTerms: [removedItem],
        unconstrainedTerms: [otherItem]
      };

      mutations.removeTermAtIndex(mockState, 0);
      expect(mockState.selectedTerms).toEqual([otherItem]);
      expect(mockState.constrainedTerms).toEqual([]);
      expect(mockState.unconstrainedTerms).toEqual([otherItem]);

      mockState.selectedTerms = [otherItem, removedItem];
      mockState.constrainedTerms = [otherItem];
      mockState.unconstrainedTerms = [removedItem];

      mutations.removeTermAtIndex(mockState, 1);
      expect(mockState.selectedTerms).toEqual([otherItem]);
      expect(mockState.constrainedTerms).toEqual([otherItem]);
      expect(mockState.unconstrainedTerms).toEqual([]);
    });

    test('acceptTermsOfUse mutates termsOfUseAccepted', () => {
      const mockState = {
        termsOfUseAccepted: false
      };

      expect(mockState.termsOfUseAccepted).toBe(false);
      mutations.acceptTermsOfUse(mockState);
      expect(mockState.termsOfUseAccepted).toBe(true);
    });

    test('setQualityScore sets the specified score value', () => {
      const mockState = {
        qualityScore: null
      };

      const expectedScore = 0.42;

      mutations.setQualityScore(mockState, expectedScore);
      expect(mockState.qualityScore).toEqual(expectedScore);
    });

    test('setQualityScore clears any scoring error', () => {
      const mockState = {
        qualityScore: null,
        scoringError: new Error('timeout of 10000ms exceeded')
      };

      mutations.setQualityScore(mockState, 0.42);
      expect(mockState.scoringError).toBeNull();
    });

    test('setScoringError captures the error', () => {
      const expectedError = new Error('a bad thing happened');

      const mockState = {
        scoringError: null
      };

      mutations.setScoringError(mockState, expectedError);
      expect(mockState.scoringError).toEqual(expectedError);
    });

    test('toggleSystem: when system is not already selected', () => {
      let system = { id: 'HP:0002664', label: 'Cancer' };
      const mockState = {
        selectedSystems: []
      };

      mutations.toggleSystem(mockState, system);
      expect(mockState.selectedSystems.length).toEqual(1);
      expect(mockState.selectedSystems).toContain(system);

      system = { id: 'HP:0000818', label: 'Hormone / Endocrine' };
      mutations.toggleSystem(mockState, system);
      expect(mockState.selectedSystems.length).toEqual(2);
      expect(mockState.selectedSystems[1]).toEqual(system);
    });

    test('toggleSystem: when system is already selected', () => {
      const mockState = {
        selectedSystems: [
          { id: 'HP:0002664', label: 'Cancer' },
          { id: 'HP:0000818', label: 'Hormone / Endocrine' }
        ]
      };

      let system = mockState.selectedSystems[1];
      mutations.toggleSystem(mockState, system);
      expect(mockState.selectedSystems.length).toEqual(1);
      expect(mockState.selectedSystems).not.toContain(system);
    });

    test('setFoundAllConditions sets the specified value', () => {
      const mockState = {
        foundAllConditions: null
      };

      // the flag starts out null
      expect(mockState.foundAllConditions).toBeNull();

      // the flag can be set to true
      mutations.setFoundAllConditions(mockState, true);
      expect(mockState.foundAllConditions).toBe(true);

      // the flag can be set to false
      mutations.setFoundAllConditions(mockState, false);
      expect(mockState.foundAllConditions).toBe(false);
    });
  });

  describe('actions', () => {
    const { actions } = storeConfig;

    beforeEach(() => {
      scoringService.score.mockReset();
      mockSaveSession.mockReset();
    });

    test('calculateQualityScore: when terms are selected', () => {
      const commit = jest.fn();

      const mockState = {
        selectedTerms: exampleTerms.slice(0, 1)
      };

      const mockResponse = {
        scaled_score: 1.42
      };

      scoringService.score.mockReturnValueOnce(Promise.resolve(mockResponse));

      return actions.calculateQualityScore({ commit, state: mockState })
        .then(() => {
          // It should call the service
          expect(scoringService.score).toHaveBeenCalledWith(mockState.selectedTerms);

          // It commits the quality score
          expect(commit).toHaveBeenCalledWith('setQualityScore', mockResponse.scaled_score);
        });
    });

    test('calculateQualityScore: when no terms are selected', () => {
      const commit = jest.fn();

      const mockState = {
        selectedTerms: []
      };

      return actions.calculateQualityScore({ commit, state: mockState })
        .then(() => {
          // It should skip calling the service
          expect(scoringService.score).not.toHaveBeenCalled();

          // It resets the quality score
          expect(commit).toHaveBeenCalledWith('setQualityScore', 0);
        });
    });

    test('calculateQualityScore: when an error occurs', () => {
      const commit = jest.fn();

      const mockState = {
        selectedTerms: exampleTerms.slice(0, 1)
      };

      const scoringError = new Error('timeout of 10000ms exceeded');

      scoringService.score.mockReturnValueOnce(Promise.reject(scoringError));

      return actions.calculateQualityScore({ commit, state: mockState })
        .then(() => {
          expect(commit).toHaveBeenCalledWith('setScoringError', scoringError);
        });
    });

    test('saveSessionData: when terms have been selected', () => {
      const commit = jest.fn();

      const mockState = {
        sessionId: '00000000-0000-0000-0000-000000000000',
        selectedTerms: exampleTerms.slice(0, 1),
        constrainedTerms: exampleTerms.slice(0, 1),
        unconstrainedTerms: [],
        selectedSystems: bodySystems.slice(0, 1),
        foundAllConditions: true,
        qualityScore: 0.42
      };

      mockSaveSession.mockReturnValueOnce(Promise.resolve());

      return actions.saveSessionData({ commit, state: mockState })
        .then(() => {
          // No mutations should be committed
          expect(commit).not.toHaveBeenCalled();

          const expectedSystem = [bodySystems[0].id];
          const expectedTerms = [{
            id: 'HP:0000316',
            label: 'Hypertelorism',
            symptom: 'Widely spaced eyes'
          }];

          const expectedData = {
            session_id: '00000000-0000-0000-0000-000000000000',
            selected_systems: expectedSystem,
            selected_terms: expectedTerms,
            constrained_terms: expectedTerms,
            unconstrained_terms: [],
            found_all: true,
            quality_score: 0.42
          };

          // Should have called into the data logging service to save
          expect(mockSaveSession)
            .toHaveBeenCalledWith(expectedData);
        });
    });
  });
});
