import * as express from "express";
import { Request, Response} from "express";
import * as cors from "cors";
import { createConnection } from "typeorm";
import { Product } from "./entity/product";

createConnection().then(db => {
    const productRepository = db.getRepository(Product);

    const app = express();
    
    app.use(cors({
        origin: ["http://localhost:3000", "http://localhost:8080", "http://localhost:4200"]
    }))
    
    app.use(express.json());

    app.get('/api/products', async (req: Request, res: Response) => {
        const products = await productRepository.find();
        res.json(products);
    });

    app.post('/api/products', async (req: Request, res: Response) => {
        const product = await productRepository.create(req.body);
        const result = await productRepository.save(product);
        return res.send(result);
    });

    app.get('/api/products/:id', async (req: Request, res: Response) => {
        const productId = Number(req.params.id);
        const product = await productRepository.findOneBy({ id: productId });
        return res.send(product);
    });

    app.put('/api/products/:id', async (req: Request, res: Response) => {
        const productId = Number(req.params.id);
        const product = await productRepository.findOneBy({ id: productId });
        productRepository.merge(product, req.body);
        const result = await productRepository.save(product)
        return res.send(result);
    });

    app.delete('/api/products/:id', async (req: Request, res: Response) => {
        const result = await productRepository.delete(req.params.id);
        return res.send(result);
    });
    
    console.log("Listening on port: 8000"); 
    app.listen(8000);
})