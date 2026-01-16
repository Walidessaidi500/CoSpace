import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEspacioPage } from './crear-espacio-page';

describe('CrearEspacioPage', () => {
  let component: CrearEspacioPage;
  let fixture: ComponentFixture<CrearEspacioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEspacioPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearEspacioPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
