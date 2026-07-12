describe('Pruebas de Autenticación - Comercial El Nogal', () => {

  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
  });

  it('Debería navegar a registro, completar el formulario, regresar e iniciar sesión', () => {
    
    // Generamos un número aleatorio para que el usuario nunca se repita en la BD
    const numeroAleatorio = Math.floor(Math.random() * 10000);
    const usuarioUnico = `user${numeroAleatorio}`;
    const emailUnico = `contacto${numeroAleatorio}@nogal.com`;

    // --- PASO 1: IR AL FORMULARIO DE REGISTRO ---
    cy.contains('a', 'Regístrate aquí').click();
    cy.contains('h3', 'Registro - Comercial El Nogal').should('be.visible');

    // --- PASO 2: LLENAR EL FORMULARIO DE REGISTRO ---
    cy.get('.col-md-8 .card-body').within(() => {
      cy.get('#txtUsername').type(usuarioUnico); // <- Ahora es dinámico y único
      cy.get('#txtEmail').type(emailUnico);      // <- Ahora es dinámico y único
      cy.get('#txtNombres').type('Juan Carlos');
      cy.get('#txtApellidos').type('Mendoza Nogal');
      
      cy.get('#selectTipoDocumento').select('DNI');
      
      // Tip: Si tu DNI o teléfono también exige ser único en la BD, cámbialo por otro número cualquiera
      cy.get('#txtNumeroDocumento').type('74859612'); 
      cy.get('#txtTelefono').type('987654321');       

      cy.get('#txtPassword').type('Clave123*');
      cy.get('#txtConfirmarPassword').type('Clave123*');

      cy.get('button.btn-success').click();
    });

    // --- PASO 3: RETORNAR AL LOGIN E INICIAR SESIÓN ---
    cy.wait(1000); 
    cy.contains('a', 'Inicia sesión aquí').click();

    cy.get('.col-md-6 .card-body').within(() => {
      // El robot inicia sesión con el usuario que acaba de inventar arriba
      cy.get('#txtUsername').clear().type(usuarioUnico, { delay: 50 });
      cy.get('#txtPassword').clear().type('Clave123*', { delay: 50 });
      
      cy.get('button.btn-primary').click({ force: true });
    });

    // --- PASO 4: VERIFICACIÓN FINAL ---
    cy.url({ timeout: 10000 }).should('include', '/dashboard'); 
  });
});