import { Component, OnInit, ChangeDetectionStrategy} from '@angular/core';

import { Subscription, Observable, BehaviorSubject, combineLatest, EMPTY, Subject } from 'rxjs';

import { Product } from './product';
import { ProductService } from './product.service';
import { ProductCategory } from '../product-categories/product-category';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { map, catchError, startWith } from 'rxjs/operators';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  pageTitle = 'Product List';
  categories$: Observable<ProductCategory[]>;

  selectedCategorySubject: Subject<number>;
  selectedCategory$: Observable<number>;

  errorMessageSubject: Subject<string>;
  errorMessage$: Observable<string>;

  products$: Observable<Product[]>;
  sub: Subscription;

  constructor(
    private productService: ProductService,
    private productCategoryService: ProductCategoryService) { 
      this.selectedCategorySubject = new Subject();
      this.selectedCategory$ = this.selectedCategorySubject.asObservable()
        .pipe(
          startWith(0)
        );
      this.errorMessageSubject = new Subject();
      this.errorMessage$ = this.errorMessageSubject.asObservable();
    }

  ngOnInit(): void {
    this.categories$ = this.productCategoryService.productCategories$;

    this.products$ = combineLatest(
      this.productService.productWithAdd$,
      this.selectedCategory$
    ).pipe(
      map(([products, selectedCategory]) => 
        products.filter(product =>
          selectedCategory ? selectedCategory === product.categoryId: true
        )
      ),
      catchError(err => {
        console.log('Error', err);
        this.errorMessageSubject.next(err);
        return EMPTY;
      })
    );
  }

  onAdd(): void {
    this.productService.setAddedProduct();
  }

  onSelected(categoryId: string): void {
    this.selectedCategorySubject.next(+categoryId);
  }
}
