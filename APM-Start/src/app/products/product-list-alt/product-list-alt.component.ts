import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Subscription, Observable, EMPTY, Subject } from 'rxjs';

import { Product } from '../product';
import { ProductService } from '../product.service';
import { catchError, startWith } from 'rxjs/operators';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListAltComponent implements OnInit{
  pageTitle = 'Products';
  selectedProductId: number;

  errorMessageSubject: Subject<string>;
  errorMessage$: Observable<string>;

  products$: Observable<Product[]>;
  sub: Subscription;

  constructor(private productService: ProductService) { 
    this.errorMessageSubject = new Subject();
      this.errorMessage$ = this.errorMessageSubject.asObservable();
  }

  ngOnInit(): void {
    this.products$ = this.productService.productWithCategories$
      .pipe(
        catchError(err => {
          console.log('Error', err);
          this.errorMessageSubject.next(err);
          return EMPTY;
        })
      );
  }

  onSelected(productId: number): void {
    this.productService.setSelectedProductId(productId);
  }
}
