import * as express from "express";
import { Request, Response} from "express";
import * as cors from "cors";
import { createConnection } from "typeorm";
import { Product } from "./entity/product";
import * as amqp from 'amqplib/callback_api';

createConnection().then(db => {
    const productRepository = db.getRepository(Product);

    amqp.connect('amqps://ybbxuunk:Pmp2KpIcWnLPIt5VPqviv34pJDvyXWOy@puffin.rmq2.cloudamqp.com/ybbxuunk', (error0, connection) => {
        if(error0) {
            console.log("Error0: ", error0); 
            throw error0;
        }

        connection.createChannel((error1, channel) => {
            if(error1) {
                console.log("Error1: ", error1); 
                throw error1;
            }

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
                channel.sendToQueue("product_created", Buffer.from(JSON.stringify(result)));
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
                const result = await productRepository.save(product);
                channel.sendToQueue("product_updated", Buffer.from(JSON.stringify(result)));
                return res.send(result);
            });
        
            app.delete('/api/products/:id', async (req: Request, res: Response) => {
                const result = await productRepository.delete(req.params.id);
                channel.sendToQueue("product_deleted", Buffer.from(req.params.id));
                return res.send(result); 
            });
        
            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const productId = Number(req.params.id);
                const product = await productRepository.findOneBy({ id: productId });
                product.likes++;
                const result = await productRepository.save(product)
                return res.send(result);
            });
            
            console.log("Listening on port: 8000"); 
            app.listen(8000);
            process.on('beforeExit', () => {
                console.log("Closing connection");
                connection.close(); 
            });
        });
    });
});