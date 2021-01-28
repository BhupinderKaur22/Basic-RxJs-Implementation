import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, throwError, combineLatest, Subject, merge, of, from } from 'rxjs';
import { tap, map, catchError, scan, shareReplay, mergeMap, concatMap, switchMap, toArray, filter } from 'rxjs/operators';

import { Product } from './product';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategory } from '../product-categories/product-category';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { Supplier } from '../suppliers/supplier';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;
  private selectedProductIdSubject: Subject<number>;
  private addedProductSubject: Subject<Product>;

  public products$: Observable<Product[]>;
  public productWithCategories$: Observable<Product[]>;
  public selectedProductId$: Observable<number>;
  public selectedProduct$: Observable<Product>;
  public addedProduct$: Observable<Product>;
  public productWithAdd$: Observable<Product[]>;

  public mergeMapSupplier$: Observable<Supplier>;
  public concatMapSupplier$: Observable<Supplier>;
  public switchMapSupplier$: Observable<Supplier>;

  public selectedProductSupplier$: Observable<Supplier[]>;

  constructor(
    private http: HttpClient,
    private supplierService: SupplierService,
    private productCategoryService: ProductCategoryService) { 

      this.selectedProductIdSubject = new Subject();
      this.selectedProductId$ = this.selectedProductIdSubject.asObservable();

      this.addedProductSubject = new Subject();
      this.addedProduct$ = this.addedProductSubject.asObservable();

      // Getting the products
      this.products$ = this.http.get<Product[]>(this.productsUrl)
        .pipe(
          tap(data => console.log('Products ', JSON.stringify(data)),
          catchError(this.handleError))
        );

      // Getting the products with categories
      this.productWithCategories$ = combineLatest(
        this.products$,
        this.productCategoryService.productCategories$
      ).pipe(
         map(([products, productCategories]) => 
          products.map(product => ({ 
              ...product,
              price: product.price * 1.5,
              searchKey: [product.productName],
              categoryName: productCategories.find(productCategory => 
                productCategory.id === product.categoryId
              ).name
          }) as Product)
        ),
        shareReplay(1)
      );

      // Getting the selected Product
      this.selectedProduct$ = combineLatest(
        this.selectedProductId$,
        this.productWithCategories$
      ).pipe(
        map(([selectedProductId, products]) => 
          products.find(product => product.id === selectedProductId)
        ),
        shareReplay(1)
      );

      // Getting the added Product
      this.productWithAdd$ = merge(
        this.productWithCategories$,
        this.addedProduct$
      ).pipe(
        scan((acc: Product[], value: Product) => [...acc, value])
      );

      // this.mergeMapSupplier$ = of(1, 5, 8)
      //   .pipe(
      //     tap(id => console.log('Merge Map Request', id)),
      //     mergeMap(id => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
      // );
      // this.concatMapSupplier$ = of(1, 5, 8)
      //   .pipe(
      //     tap(id => console.log('Concat Map Request', id)),
      //     concatMap(id => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
      // );
      // this.switchMapSupplier$ = of(1, 5, 8)
      //   .pipe(
      //     tap(id => console.log('Switch Map Request', id)),
      //     switchMap(id => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
      // );

      // this.mergeMapSupplier$.subscribe(data => console.log('Merge Map Result ', data));
      // this.concatMapSupplier$.subscribe(data => console.log('Concat Map Result ', data));
      // this.switchMapSupplier$.subscribe(data => console.log('Switch  Map Result ', data));

      // this.selectedProductSupplier$ = combineLatest(
        // this.selectedProduct$,
        // this.supplierService.suppliers$
      // ).pipe(
      //   map(([selectedProduct, suppliers]) =>
      //     suppliers.filter(supplier => selectedProduct.supplierIds.includes(supplier.id))
      //   )
      // );

      this.selectedProductSupplier$ = this.selectedProduct$
        .pipe(
          filter(selectedProduct => Boolean(selectedProduct)),
          switchMap(selectedProduct =>
            from(selectedProduct.supplierIds)
              .pipe(
                mergeMap(supplierId => this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)),
                toArray()
              )
          )
        );

    }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      // category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

  public setSelectedProductId(id: number): void {
    this.selectedProductIdSubject.next(id);
  }

  public setAddedProduct(product?: Product): void {
    product = product || this.fakeProduct();
    this.addedProductSubject.next(product);
  }
}
