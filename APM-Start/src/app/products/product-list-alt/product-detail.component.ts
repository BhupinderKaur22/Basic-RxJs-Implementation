import { Component } from '@angular/core';

import { ProductService } from '../product.service';
import { Product } from '../product';
import { Observable } from 'rxjs';
import { Supplier } from '../../suppliers/supplier';
import { map } from 'rxjs/operators';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent {
  pageTitle$: Observable<string>;
  errorMessage = '';
  selectedProduct$: Observable<Product>;
  selectedProductSuppliers$: Observable<Supplier[]>

  constructor(private productService: ProductService) { 
    this.selectedProduct$ = this.productService.selectedProduct$;
    this.selectedProductSuppliers$ = this.productService.selectedProductSupplier$;

    this.pageTitle$ = this.selectedProduct$
      .pipe(
        map(product => product ? `Product Detail: ${product.productName}`: null)
      )

  }

}
