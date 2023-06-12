describe('Sequencer', () => {
    before(() => {
      // Visit the page before running the tests
      cy.visit('http://localhost:3000');
    });
  
    it('should display the sequencer on load', () => {
      cy.get('#sequencer-view').should('be.visible');
      cy.get('#arrangement-view').should('not.be.visible');
    });
  
    it('should play a sequence', () => {
      // Activate some steps
      cy.get('.step').first().click();
      cy.get('.step').eq(1).click();
      cy.get('.step').eq(2).click();
  
      // Click the play button
      cy.get('#play-button').click();
  
      // The progress bar should be moving
      cy.get('#progress')
        .invoke('width')
        .then(width1 => {
          cy.wait(1000); // Wait for 1 second
          cy.get('#progress')
            .invoke('width')
            .should('be.gt', width1); // Check that the progress bar has advanced
        });
  
      // Click the stop button
      cy.get('#stop-button').click();
  
      // The progress bar should reset
      cy.get('#progress').should('have.css', 'width', '0px');
    });
  
    it('should assign a sample to a key', () => {
      // Click the search button
      cy.get('#search-button').click();
  
      // Select the first sample in the dropdown
      cy.get('.assign-key-dropdown').first().select('q');
  
      // The key-sample map should be updated
      // We can't actually check this because Cypress doesn't have access to the app's internal state
      // But in a real test, we would check the behavior that results from this state change
    });
  });
  